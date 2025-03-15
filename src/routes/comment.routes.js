import Router from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {  
    addComment,
    deleteComment,
    listAllComments,
    updateComment,
} from "../controllers/comment.controller.js";

const router = Router();
router.use(verifyJWT);

router
    .route("/:videoId")
    .post(addComment)
    .get(listAllComments);

router
    .route("/:commentId")
    .patch(updateComment)
    .delete(deleteComment);

export default router;