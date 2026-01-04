// PMTK2 - A modern Proxmox Monitoring Toolkit
// Copyright (C) 2026 Logan Devine <logan@zirco.dev>
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
// SPDX-License-Identifier: MPL-2.0

// We check for package updates every update check interval
import { Proxmox } from "proxmox-api";
import { globalConfig } from "./config.js";
import sendAlerts from "./alerting.js";

export async function checkForAptUpdates(pve: Proxmox.Api) {
    if (!globalConfig.aptMonitoring.enabled) return 0;

    console.log("Checking for APT updates on all nodes...");
    for (const { node } of await pve.nodes.$get()) {
        const updates = await pve.nodes.$(node).apt.update.$get();

        if (updates.length > 0) {
            sendAlerts(
                `:package: There are ${updates.length} package updates available for node ${node}.`
            );
        } else {
            console.log(`No APT updates available for node ${node}.`);
        }
    }
}
