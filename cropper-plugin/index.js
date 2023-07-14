// {SITE_ROOT_DIR}/plugin-dynamic-routes/index.js

module.exports = function (context, options) {
    return {
        name: 'cropper',

        async contentLoaded({ content, actions }) {
            const { routes } = options
            const { addRoute } = actions

            routes.map(route => addRoute(route))
        }
    }
}