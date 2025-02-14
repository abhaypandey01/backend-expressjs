const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next))
        .catch(err => {
            next(err)
        })
    }
}

export { asyncHandler }

/*
const asyncHandler = (fn) => (req, res, next) => {
    try{
    await fn(req res,)
    } catch (err){
        res.status(err.code || 500).json({
        message: err.message,
        success : false
})
    }
    }
*/