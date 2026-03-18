const { execSync } = require('child_process');

const defaultPort = Number(process.argv[2] || process.env.PORT || 3001);

if (!Number.isFinite(defaultPort) || defaultPort <= 0) {
  console.error('Invalid port value.');
  process.exit(1);
}

function getListeningPids(port) {
  try {
    if (process.platform === 'win32') {
      const output = execSync(
        `powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess"`,
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
      );

      return Array.from(
        new Set(
          output
            .split(/\r?\n/)
            .map((value) => value.trim())
            .filter(Boolean),
        ),
      );
    }

    const output = execSync(`lsof -ti tcp:${port}`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });

    return Array.from(
      new Set(
        output
          .split(/\r?\n/)
          .map((value) => value.trim())
          .filter(Boolean),
      ),
    );
  } catch {
    return [];
  }
}

function killPid(pid) {
  if (process.platform === 'win32') {
    execSync(`taskkill /PID ${pid} /F`, {
      stdio: ['ignore', 'ignore', 'ignore'],
    });
    return;
  }

  execSync(`kill -9 ${pid}`, {
    stdio: ['ignore', 'ignore', 'ignore'],
  });
}

const pids = getListeningPids(defaultPort);

if (pids.length === 0) {
  console.log(`Port ${defaultPort} is already free.`);
  process.exit(0);
}

for (const pid of pids) {
  try {
    killPid(pid);
    console.log(`Killed process ${pid} on port ${defaultPort}.`);
  } catch {
    console.warn(`Could not kill process ${pid} on port ${defaultPort}.`);
  }
}
