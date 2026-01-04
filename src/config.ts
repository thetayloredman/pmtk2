// PMTK2 - A modern Proxmox Monitoring Toolkit
// Copyright (C) 2026 Logan Devine <logan@zirco.dev>
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
// SPDX-License-Identifier: MPL-2.0

import { type } from "arktype";
import * as fs from "node:fs/promises";

export const Config = type({
    proxmox: {
        host: "string",
        port: "number = 8006",
        schema: "'http' | 'https' = 'https'",
        tokenID: "string",
        tokenSecret: "string",
    },
    alerting: {
        discord: {
            enabled: "true",
            webhookURL: "string.url.parse",
            alertMessagePrefix: "string",
        },
    },
    checkRateMs: "number = 30000",
});

export const globalConfig = Config.assert(
    await fs.readFile("./config.json", "utf-8").then(JSON.parse)
);
