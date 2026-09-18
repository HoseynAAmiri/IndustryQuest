// DEMO_MODE=1 shows the fictional-data banner and one-click persona sign-in. Never set it in production.
export const isDemo = () => process.env.DEMO_MODE === "1";

export const coordinatorEmail = () => process.env.COORDINATOR_EMAIL ?? "";
