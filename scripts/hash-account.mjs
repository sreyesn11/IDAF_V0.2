#!/usr/bin/env node
import { randomBytes, scryptSync } from 'node:crypto';

const password = process.argv[2];
if (!password) {
  console.error('Uso: node scripts/hash-account.mjs "<contraseña>"');
  process.exit(1);
}

const salt = randomBytes(32).toString('hex');
const passwordHash = scryptSync(password, Buffer.from(salt, 'hex'), 64).toString('hex');

console.log(JSON.stringify({ salt, passwordHash }, null, 2));
