#!/usr/bin/env node

import { spawn, exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Parse command line arguments
const args = process.argv.slice(2);
const verbose = args.includes("--verbose") || args.includes("-v");

// Configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const COMPOSE_FILE = "docker-compose.yml";
const SERVICE_NAME = "mongo";

/**
 * Logs a message with optional verbose mode filtering
 */
function log(message, level = "info") {
  const prefix =
    {
      info: "→",
      success: "✓",
      error: "✗",
      verbose: "  ",
    }[level] || "→";

  if (level === "verbose" && !verbose) return;

  console.log(`${prefix} ${message}`);
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
    console.error(`Docker is not running: ${error.message}`);
    return false;
  }
}

/**
 * Attempts to start Docker Desktop (Windows/Mac)
 */
async function startDocker() {
  log("Docker is not running. Attempting to start Docker...");

  try {
    // Try to start Docker Desktop on Windows
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

    // Wait for Docker to start (max 30 seconds)
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
    console.error(`Error checking container existence: ${error.message}`);
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
    console.error(`Error checking container status: ${error.message}`);
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
 * Starts the MongoDB container
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
 * Waits for MongoDB to be ready
 */
async function waitForMongo(containerName, retries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    log(`Checking MongoDB connection (attempt ${attempt}/${retries})...`);

    try {
      // Check if container is running
      if (await isContainerRunning(containerName)) {
        // Try to connect to MongoDB
        await runCommand(
          `docker exec ${containerName} mongosh --eval "db.adminCommand('ping')" --quiet`,
        );
        log("MongoDB is ready", "success");
        return true;
      } else {
        log("Container is not running", "verbose");
      }
    } catch (error) {
      if (verbose) {
        log(`Connection check failed: ${error.message}`, "verbose");
      }
    }

    if (attempt < retries) {
      log(
        `Waiting ${RETRY_DELAY_MS / 1000} seconds before retry...`,
        "verbose",
      );
      await sleep(RETRY_DELAY_MS);
    }
  }

  return false;
}

/**
 * Starts the NestJS application
 */
function startApp() {
  log("Starting NestJS application...");
  log("─────────────────────────────────────────────────────────────");

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
 * Main execution
 */
async function main() {
  try {
    console.log("🚀 Starting Clouded Moon Music with MongoDB\n");

    // Step 1: Check if Docker is running, try to start if not
    if (!(await isDockerRunning())) {
      if (!(await startDocker())) {
        log("Please start Docker manually and try again", "error");
        process.exit(1);
      }
    } else {
      log("Docker is running", "success");
    }

    // Get the container name from docker-compose
    const projectName = "clouded-moon-music";
    const containerName = `${projectName}-${SERVICE_NAME}-1`;

    // Step 2: Create containers if they don't exist
    if (!(await containerExists(containerName))) {
      log("MongoDB container does not exist");
      if (!(await createContainers())) {
        log("Failed to create containers", "error");
        process.exit(1);
      }
    } else {
      log("MongoDB container exists", "success");
    }

    // Step 3: Start container if not running
    if (!(await isContainerRunning(containerName))) {
      log("Starting MongoDB container...");

      try {
        await startContainer(containerName);
        log("MongoDB container started", "success");
      } catch (error) {
        log(error.message, "error");
        process.exit(1);
      }
    } else {
      log("MongoDB container is already running", "success");
    }

    // Step 4: Wait for MongoDB to be ready with retries
    if (!(await waitForMongo(containerName))) {
      log("Failed to connect to MongoDB after multiple attempts", "error");
      log(
        "Container may be starting. Check logs with: docker logs " +
          containerName,
        "info",
      );
      process.exit(1);
    }

    // Step 5: Start the application
    console.log("");
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
