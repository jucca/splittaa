export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateEnvAtStartup } = await import("./lib/config/env");
    validateEnvAtStartup();
  }
}
