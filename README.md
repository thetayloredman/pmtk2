# pmtk2

PMTK is a simple monitoring solution for Proxmox VE environments. It provides a method of alerting system administrators of changes to VM states and failed jobs.

## Setup

PMTK runs as a daemon using the provided systemd service file. To set it up, follow these steps:

1. Install the required dependencies:

```bash
npm install
```

2. Then use pm2 to start the service:

```bash
pm2 start --name pmtk2 npm -- start
pm2 save
pm2 startup
```

## License

This project is licensed under the Mozilla Public License 2.0. See the [LICENSE](LICENSE) file for details.
