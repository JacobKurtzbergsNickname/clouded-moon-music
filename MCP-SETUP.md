# MCP Server Configuration Guide

This document explains how to configure and use the Model Context Protocol (MCP) servers for your project.

## Overview

The `mcp-config.json` file contains configuration for three MCP servers:

1. **MongoDB MCP Server** - For database operations
2. **Context7** - For library documentation lookup
3. **Postman MCP Server** - For API testing and management

## 📋 Prerequisites

- Node.js (v20.19.0+ or v22.12.0+ or v23+)
- A Postman API key ([Get one here](https://postman.postman.co/settings/me/api-keys))

## 🔧 Configuration Details

### 1. MongoDB MCP Server

**Purpose**: Provides AI assistants with access to your MongoDB database for querying and analysis.

**Configuration**:

```json
{
  "mongodb": {
    "command": "npx",
    "args": ["-y", "mongodb-mcp-server@latest", "--readOnly"],
    "env": {
      "MDB_MCP_CONNECTION_STRING": "mongodb://localhost:27017/clouded-moon-music",
      "MDB_MCP_READ_ONLY": "true",
      "MDB_MCP_LOGGERS": "disk,mcp"
    }
  }
}
```

**Setup Steps**:

1. Update the `MDB_MCP_CONNECTION_STRING` to match your MongoDB connection
2. For production, replace with your actual MongoDB URI (e.g., `mongodb+srv://username:password@cluster.mongodb.net/dbname`)
3. The `--readOnly` flag ensures safe, read-only access to your data

**Security Notes**:

- 🔒 The configuration uses read-only mode by default for safety
- 🔒 Store sensitive credentials in environment variables instead of the config file
- 🔒 For MongoDB Atlas, you can use Service Account credentials instead:

  ```json
  "env": {
    "MDB_MCP_API_CLIENT_ID": "your-atlas-service-accounts-client-id",
    "MDB_MCP_API_CLIENT_SECRET": "your-atlas-service-accounts-client-secret"
  }
  ```

**Available Tools**:

- `find` - Query MongoDB collections
- `aggregate` - Run aggregation pipelines
- `list-collections` - List all collections
- `list-databases` - List all databases
- `collection-schema` - Infer collection schemas
- And more...

### 2. Context7 (Library Documentation)

**Purpose**: Provides access to up-to-date documentation for libraries and frameworks.

**Configuration**:

```json
{
  "context7": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-everything"]
  }
}
```

**Setup Steps**:

1. No additional configuration needed - works out of the box!
2. The server automatically provides documentation for thousands of libraries

**Features**:

- Search documentation for NestJS, MongoDB, and other libraries
- Get code examples and API references
- Access conceptual guides and tutorials

### 3. Postman MCP Server

**Purpose**: Enables AI assistants to interact with Postman for API testing and management.

**Configuration**:

```json
{
  "postman": {
    "command": "npx",
    "args": ["@postman/postman-mcp-server", "--minimal"],
    "env": {
      "POSTMAN_API_KEY": "YOUR_POSTMAN_API_KEY_HERE"
    }
  }
}
```

**Setup Steps**:

1. Get your Postman API key:
   - Go to <https://postman.postman.co/settings/me/api-keys>
   - Click "Generate API Key"
   - Copy the key
2. Replace `YOUR_POSTMAN_API_KEY_HERE` with your actual API key
3. Choose your mode:
   - `--minimal` (default): Essential tools only (37 tools)
   - `--full`: All available tools (100+ tools)
   - `--code`: Code generation tools

**Available Modes**:

- **Minimal Mode** (default): Best for basic operations
  - Create/manage collections
  - Create/manage environments
  - Basic API testing
- **Full Mode**: Advanced features
  - All minimal mode features
  - Advanced collaboration tools
  - Enterprise features
- **Code Mode**: For developers
  - Search API definitions
  - Generate client code
  - Code synchronization

**Security Best Practices**:
🔒 **Do NOT commit your API key to version control!**

- Use environment variables instead:

  ```bash
  # Windows PowerShell
  $env:POSTMAN_API_KEY="your-api-key"

  # Windows CMD
  set "POSTMAN_API_KEY=your-api-key"

  # Linux/macOS
  export POSTMAN_API_KEY="your-api-key"
  ```

- Then update the config to use the environment variable:

  ```json
  "env": {
    "POSTMAN_API_KEY": "${POSTMAN_API_KEY}"
  }
  ```

## 🚀 Usage with Different MCP Clients

### Claude Desktop

1. Copy the contents of `mcp-config.json`
2. Open Claude Desktop configuration:
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
3. Paste the configuration

### VS Code (with Copilot or other MCP-compatible extensions)

1. Create `.vscode/mcp.json` in your project root
2. Use this format:

   ```json
   {
     "servers": {
       "mongodb": {
         "type": "stdio",
         "command": "npx",
         "args": ["-y", "mongodb-mcp-server@latest", "--readOnly"],
         "env": {
           "MDB_MCP_CONNECTION_STRING": "mongodb://localhost:27017/clouded-moon-music"
         }
       }
     }
   }
   ```

### Cursor

1. Open Settings → Features → Model Context Protocol
2. Add each server configuration manually
3. Or use the install buttons from the respective GitHub repositories

## 🔒 Security Recommendations

1. **Never commit API keys or connection strings** to version control
2. Use **environment variables** for sensitive data
3. Use **read-only mode** for MongoDB when possible
4. Regularly **rotate API keys** and credentials
5. **Limit permissions** to only what's needed
6. For MongoDB Atlas, use **Service Accounts** with minimal required roles

## 📚 Additional Resources

- [MongoDB MCP Server Documentation](https://github.com/mongodb-js/mongodb-mcp-server)
- [Context7 Documentation](https://context7.com)
- [Postman MCP Server Documentation](https://github.com/postmanlabs/postman-mcp-server)
- [Model Context Protocol Specification](https://modelcontextprotocol.io)

## 🐛 Troubleshooting

### MongoDB Connection Issues

- Verify your connection string is correct
- Ensure MongoDB is running
- Check firewall settings
- For Atlas, verify IP whitelist

### Postman API Key Issues

- Ensure the API key is valid and not expired
- Verify the key has necessary permissions
- Check for typos in the configuration

### Node.js Version Issues

- Ensure you have Node.js v20.19.0 or higher
- Update Node.js if necessary: <https://nodejs.org/>

## 📝 Example Commands

Test MongoDB connection:

```bash
npx -y mongodb-mcp-server@latest --dryRun
```

Test Postman configuration:

```bash
POSTMAN_API_KEY=your-key npx @postman/postman-mcp-server --minimal
```

## 🎯 Next Steps

1. Update the MongoDB connection string to match your setup
2. Add your Postman API key
3. Choose the appropriate mode for Postman (minimal/full/code)
4. Configure your MCP client (Claude, VS Code, Cursor, etc.)
5. Start using AI assistants with your configured servers!
