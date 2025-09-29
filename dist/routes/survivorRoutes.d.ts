declare global {
    namespace Express {
        interface User {
            id: string;
        }
        interface Request {
            user?: User;
        }
    }
}
declare const router: import("express-serve-static-core").Router;
export default router;
//# sourceMappingURL=survivorRoutes.d.ts.map