/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "convex-not-to-frontend",
      severity: "error",
      comment:
        "Convex backend must not import Next.js app or React components",
      from: { path: "^convex" },
      to: { path: "^(app|components|hooks|lib)" },
    },
    {
      name: "ui-not-to-features",
      severity: "error",
      comment: "UI primitives must not depend on feature modules",
      from: { path: "^components/ui" },
      to: { path: "^components/features" },
    },
    {
      name: "features-not-to-app",
      severity: "error",
      comment: "Feature components must not import app routes",
      from: { path: "^components/features" },
      to: { path: "^app" },
    },
  ],
  options: {
    doNotFollow: {
      path: "node_modules",
    },
    tsPreCompilationDeps: true,
    combinedDependencies: true,
    exclude: {
      path: "(^|/)node_modules|\\.next|tests/e2e",
    },
  },
};
