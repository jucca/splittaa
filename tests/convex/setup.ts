import schema from "../../convex/schema";

/** All Convex function modules for convex-test. */
export const convexModules = import.meta.glob("../../convex/**/*.ts");

export { schema };
