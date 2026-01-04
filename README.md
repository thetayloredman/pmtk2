# pmtk2

PMTK is a simple monitoring solution for Proxmox VE environments. It provides a method of alerting system administrators of changes to VM states and failed jobs.

## Setup

PMTK runs as a daemon using the provided systemd service file. To set it up, follow these steps:

1. Install the required dependencies:

```bash
npm install
```

2. Copy the `pmtk2.service` file to the systemd system directory:

```bash
sudo cp pmtk2.service /etc/systemd/system/
```

3. Reload the systemd daemon to recognize the new service:

```bash
sudo systemctl daemon-reload
```

4. Enable and start the PMTK service:

```bash
sudo systemctl enable --now pmtk2
```

## License

This project is licensed under the Mozilla Public License 2.0. See the [LICENSE](LICENSE) file for details.
