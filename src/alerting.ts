// PMTK2 - A modern Proxmox Monitoring Toolkit
// Copyright (C) 2026 Logan Devine <logan@zirco.dev>
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
// SPDX-License-Identifier: MPL-2.0

import { globalConfig } from "./config.js";

async function sendDiscordAlert(message: string) {
    if (!globalConfig.alerting.discord.enabled) return;

    const { webhookURL, alertMessagePrefix } = globalConfig.alerting.discord;

    const fullMessage = `${alertMessagePrefix}${message}`;

    let res = await fetch(webhookURL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            content: fullMessage,
        }),
    }).catch((err) => {
        console.error("Failed to send Discord alert:", err);
    });

    if (!res?.ok) {
        console.error("Failed to send Discord alert:", res?.statusText);
    }
}

export default function sendAlerts(message: string) {
    sendDiscordAlert(message);
}
