#!/usr/bin/env node

import { spawn, exec } from "child_process";
import { promisify } from "util";
import chalk from "chalk";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const execAsync = promisify(exec);

// Parse command line arguments
const args = process.argv.slice(2);
const verbose = args.includes("--verbose") || args.includes("-v");

// Configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const COMPOSE_FILE = "docker-compose.yml";
const PROJECT_NAME = "clouded-moon-music";

// Service configurations
const SERVICES = {
  mongo: {
    name: "mongo",
    displayName: "MongoDB",
    icon: "🍃",
    healthCheck: async (containerName) => {
      const user = process.env.MONGO_USER || "admin";
      const password =
        process.env.MONGO_PASSWORD || "PreahChanTravPopookKrap2026";
      const authSource = process.env.MONGO_AUTH_SOURCE || "admin";
      await execAsync(
        `docker exec ${containerName} mongosh -u ${user} -p ${password} --authenticationDatabase ${authSource} --eval "db.adminCommand('ping')" --quiet`,
      );
    },
  },
  postgres: {
    name: "postgres",
    displayName: "PostgreSQL",
    icon: "🐘",
    healthCheck: async (containerName) => {
      const user = process.env.POSTGRES_USER || "admin";
      const password =
        process.env.POSTGRES_PASSWORD || "PreahChanTravPopookKrap2026";
      const database = process.env.POSTGRES_DB || "clouded_moon_music";
      // Test actual login with credentials, not just pg_isready
      await execAsync(
        `docker exec -e PGPASSWORD=${password} ${containerName} psql -U ${user} -d ${database} -c "SELECT 1" -t`,
      );
    },
  },
  mongoExpress: {
    name: "mongo-express",
    displayName: "Mongo Express",
    icon: "🌐",
    optional: true,
    healthCheck: async (containerName) => {
      // For web UIs, just check if container is running
      await execAsync(
        `docker ps --filter "name=${containerName}" --filter "status=running"`,
      );
    },
  },
  pgadmin: {
    name: "pgadmin",
    displayName: "pgAdmin",
    icon: "🔧",
    optional: true,
    healthCheck: async (containerName) => {
      // For web UIs, just check if container is running
      await execAsync(
        `docker ps --filter "name=${containerName}" --filter "status=running"`,
      );
    },
  },
};

// Spinner frames
const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
let spinnerIndex = 0;

/**
 * Get next spinner frame
 */
function getSpinnerFrame() {
  const frame = SPINNER_FRAMES[spinnerIndex];
  spinnerIndex = (spinnerIndex + 1) % SPINNER_FRAMES.length;
  return frame;
}

/**
 * Logs a message with optional verbose mode filtering
 */
function log(message, level = "info") {
  const prefix =
    {
      info: chalk.blue("→"),
      success: chalk.green("✓"),
      error: chalk.red("✗"),
      warning: chalk.yellow("⚠"),
      verbose: chalk.gray("  "),
      spinner: chalk.cyan(getSpinnerFrame()),
    }[level] || chalk.blue("→");

  if (level === "verbose" && !verbose) return;

  console.log(`${prefix} ${message}`);
}

/**
 * Print a styled header
 */
function printHeader(title) {
  const width = 55;
  const padding = Math.floor((width - title.length - 2) / 2);
  const line = "═".repeat(width);
  const titleLine =
    "║" +
    " ".repeat(padding) +
    title +
    " ".repeat(width - padding - title.length - 2) +
    "║";

  console.log(chalk.cyan("╔" + line + "╗"));
  console.log(chalk.cyan(titleLine));
  console.log(chalk.cyan("╚" + line + "╝"));
  console.log();
}

/**
 * Print a status table
 */
function printStatusTable(statuses) {
  console.log();
  statuses.forEach(({ icon, name, status, time }) => {
    const statusText =
      status === "ready"
        ? chalk.green("✓ ready" + (time ? ` (${time}s)` : ""))
        : status === "starting"
          ? chalk.yellow("starting...")
          : status === "checking"
            ? chalk.cyan("checking...")
            : status === "error"
              ? chalk.red("✗ error")
              : chalk.gray("pending");

    console.log(`  ${icon} ${name.padEnd(20)} ${statusText}`);
  });
  console.log();
}

/**
 * Executes a shell command and returns the result
 */
async function runCommand(command, options = {}) {
  try {
    const result = await execAsync(command, options);
    if (verbose && result.stdout) {
      log(result.stdout.trim(), "verbose");
    }
    if (verbose && result.stderr) {
      log(result.stderr.trim(), "verbose");
    }
    return result;
  } catch (error) {
    if (verbose) {
      log(error.stdout?.trim() || "", "verbose");
      log(error.stderr?.trim() || "", "verbose");
    }
    throw error;
  }
}

/**
 * Checks if Docker is running
 */
async function isDockerRunning() {
  try {
    await runCommand("docker info");
    return true;
  } catch (error) {
    log(`Docker is not running: ${error.message}`, "error");
    return false;
  }
}

/**
 * Attempts to start Docker Desktop (Windows/Mac)
 */
async function startDocker() {
  log("Docker is not running. Attempting to start Docker...", "warning");

  try {
    if (process.platform === "win32") {
      await runCommand(
        "powershell -Command \"Start-Process 'C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe'\"",
      );
    } else if (process.platform === "darwin") {
      await runCommand("open -a Docker");
    } else {
      log("Cannot automatically start Docker on this platform", "error");
      return false;
    }

    log("Waiting for Docker to start...");
    for (let i = 0; i < 30; i++) {
      await sleep(1000);
      if (await isDockerRunning()) {
        log("Docker started successfully", "success");
        return true;
      }
    }

    log("Docker failed to start within 30 seconds", "error");
    return false;
  } catch (error) {
    log(`Failed to start Docker: ${error.message}`, "error");
    return false;
  }
}

/**
 * Checks if a container exists
 */
async function containerExists(containerName) {
  try {
    const result = await runCommand(
      `docker ps -a --filter "name=${containerName}" --format "{{.Names}}"`,
    );
    return result.stdout.trim().includes(containerName);
  } catch (error) {
    log(`Error checking container existence: ${error.message}`, "error");
    return false;
  }
}

/**
 * Checks if a container is running
 */
async function isContainerRunning(containerName) {
  try {
    const result = await runCommand(
      `docker ps --filter "name=${containerName}" --filter "status=running" --format "{{.Names}}"`,
    );
    return result.stdout.trim().includes(containerName);
  } catch (error) {
    log(`Error checking if container is running: ${error.message}`, "error");
    return false;
  }
}

/**
 * Creates containers from docker-compose
 */
async function createContainers() {
  log("Creating containers from docker-compose...");
  try {
    await runCommand(`docker-compose -f ${COMPOSE_FILE} up --no-start`);
    log("Containers created successfully", "success");
    return true;
  } catch (error) {
    log(`Failed to create containers: ${error.message}`, "error");
    return false;
  }
}

/**
 * Starts a container
 */
async function startContainer(containerName) {
  try {
    await runCommand(`docker start ${containerName}`);
    return true;
  } catch (error) {
    throw new Error(`Failed to start container: ${error.message}`);
  }
}

/**
 * Waits for a service to be ready
 */
async function waitForService(
  serviceConfig,
  containerName,
  retries = MAX_RETRIES,
) {
  const startTime = Date.now();

  for (let attempt = 1; attempt <= retries; attempt++) {
    log(
      `${serviceConfig.icon} Checking ${serviceConfig.displayName} connection (${attempt}/${retries})...`,
      "verbose",
    );

    try {
      if (await isContainerRunning(containerName)) {
        await serviceConfig.healthCheck(containerName);
        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
        return { success: true, time: elapsedTime };
      } else {
        log(`${serviceConfig.displayName} container is not running`, "verbose");
      }
    } catch (error) {
      if (verbose) {
        log(
          `${serviceConfig.displayName} health check failed: ${error.message}`,
          "verbose",
        );
      }
    }

    if (attempt < retries) {
      await sleep(RETRY_DELAY_MS);
    }
  }

  return { success: false, time: null };
}

/**
 * Starts the NestJS application
 */
function startApp() {
  console.log(chalk.cyan("─".repeat(57)));
  log(chalk.bold("Starting NestJS application..."));
  console.log(chalk.cyan("─".repeat(57)));
  console.log();

  const app = spawn("npm", ["run", "dev"], {
    stdio: "inherit",
    shell: true,
  });

  app.on("close", (code) => {
    process.exit(code);
  });
}

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get container name for a service
 */
function getContainerName(serviceName) {
  return `${PROJECT_NAME}-${serviceName}-1`;
}

/**
 * Main execution
 */
async function main() {
  const overallStartTime = Date.now();

  try {
    printHeader("🚀 Clouded Moon Music - Dev Startup");

    // Step 1: Check if Docker is running
    if (!(await isDockerRunning())) {
      if (!(await startDocker())) {
        log("Please start Docker manually and try again", "error");
        console.log();
        console.log(
          chalk.gray(
            "  Tip: Make sure Docker Desktop is installed and running",
          ),
        );
        process.exit(1);
      }
    } else {
      log("Docker is running", "success");
    }

    // Step 2: Check and create containers
    const containerChecks = await Promise.all(
      Object.entries(SERVICES).map(async ([key, service]) => {
        const containerName = getContainerName(service.name);
        const exists = await containerExists(containerName);
        return { key, service, containerName, exists };
      }),
    );

    const missingContainers = containerChecks.filter((c) => !c.exists);

    if (missingContainers.length > 0) {
      log(
        `Missing ${missingContainers.length} container(s), creating from docker-compose...`,
      );
      if (!(await createContainers())) {
        log("Failed to create containers", "error");
        process.exit(1);
      }
    } else {
      log("All containers exist", "success");
    }

    // Step 3: Start all containers in parallel
    log("Starting containers...");

    const startResults = await Promise.allSettled(
      containerChecks.map(async ({ containerName, service }) => {
        if (!(await isContainerRunning(containerName))) {
          await startContainer(containerName);
          return { service: service.displayName, started: true };
        }
        return { service: service.displayName, started: false };
      }),
    );

    const startedContainers = startResults
      .filter((r) => r.status === "fulfilled" && r.value.started)
      .map((r) => r.value.service);

    if (startedContainers.length > 0) {
      log(`Started: ${startedContainers.join(", ")}`, "success");
    } else {
      log("All containers were already running", "success");
    }

    // Step 4: Wait for all services to be ready (in parallel)
    log("Waiting for services to be ready...");

    // Separate required and optional services
    const requiredServices = containerChecks.filter((c) => !c.service.optional);
    const optionalServices = containerChecks.filter((c) => c.service.optional);

    // Check required services
    const requiredChecks = await Promise.all(
      requiredServices.map(({ service, containerName }) =>
        waitForService(service, containerName).then((result) => ({
          service,
          ...result,
        })),
      ),
    );

    // Check optional services (don't fail if they're not ready)
    const optionalChecks = await Promise.allSettled(
      optionalServices.map(({ service, containerName }) =>
        waitForService(service, containerName, 1).then((result) => ({
          service,
          ...result,
        })),
      ),
    );

    // Format status table
    const allStatuses = [
      ...requiredChecks.map(({ service, success, time }) => ({
        icon: service.icon,
        name: service.displayName,
        status: success ? "ready" : "error",
        time,
      })),
      ...optionalChecks.map((result) => {
        if (result.status === "fulfilled") {
          const { service, success, time } = result.value;
          return {
            icon: service.icon,
            name: service.displayName,
            status: success ? "ready" : "error",
            time,
          };
        }
        return {
          icon: "🌐",
          name: "Service",
          status: "error",
          time: null,
        };
      }),
    ];

    printStatusTable(allStatuses);

    // Check if any required service failed
    const failedRequired = requiredChecks.filter((c) => !c.success);

    if (failedRequired.length > 0) {
      log(
        `Failed to connect to required services: ${failedRequired.map((c) => c.service.displayName).join(", ")}`,
        "error",
      );
      console.log();
      console.log(chalk.gray("  Troubleshooting tips:"));
      console.log(
        chalk.gray("  • Check container logs: docker logs <container-name>"),
      );
      console.log(chalk.gray("  • Restart containers: docker-compose restart"));
      console.log(
        chalk.gray(
          "  • Check ports are not in use: netstat -an | findstr :27017",
        ),
      );
      process.exit(1);
    }

    const overallTime = ((Date.now() - overallStartTime) / 1000).toFixed(1);
    log(
      chalk.bold(`All required services ready in ${overallTime}s`),
      "success",
    );

    // Show URLs for admin interfaces
    const optionalReady = optionalChecks.filter(
      (r) => r.status === "fulfilled" && r.value.success,
    );
    if (optionalReady.length > 0) {
      console.log(chalk.gray("  Admin interfaces:"));
      if (optionalReady.some((r) => r.value.service.name === "mongo-express")) {
        console.log(chalk.gray("  • Mongo Express: http://localhost:8083"));
      }
      if (optionalReady.some((r) => r.value.service.name === "pgadmin")) {
        console.log(chalk.gray("  • pgAdmin: http://localhost:5050"));
      }
      console.log();
    }

    // Step 5: Start the application
    startApp();
  } catch (error) {
    log(`Unexpected error: ${error.message}`, "error");
    if (verbose) {
      console.error(error);
    }
    process.exit(1);
  }
}

// Run the script
main();
