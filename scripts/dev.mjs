import { spawn } from 'node:child_process';
import net from 'node:net';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const children = new Set();
let shuttingDown = false;

function isPortOpen(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = new net.Socket();

    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });

    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });

    socket.setTimeout(1000, () => {
      socket.destroy();
      resolve(false);
    });

    socket.connect(port, host);
  });
}

function startProcess(name, args) {
  const child = spawn(npmCommand, args, {
    stdio: 'inherit',
    env: process.env,
  });

  children.add(child);

  child.on('exit', (code, signal) => {
    children.delete(child);

    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    for (const runningChild of children) {
      runningChild.kill('SIGTERM');
    }

    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });

  return child;
}

function shutdown(signal) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  for (const child of children) {
    child.kill('SIGTERM');
  }

  setTimeout(() => {
    for (const child of children) {
      child.kill('SIGKILL');
    }
  }, 3000).unref();

  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

if (!(await isPortOpen(4300))) {
  startProcess('api', ['run', 'api:start']);
} else {
  console.log('Port 4300 is already in use. Reusing the existing API process.');
}

if (!(await isPortOpen(4200))) {
  startProcess('web', ['run', 'start:web']);
} else {
  console.log('Port 4200 is already in use. Reusing the existing frontend process.');
}

if (children.size === 0) {
  process.exit(0);
}
