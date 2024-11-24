/* eslint-disable no-undef */
const Hapi = require('@hapi/hapi');
const { addNoteHandler, getAllNotesHandler, getNoteByIdHandler, editNoteByIdHandler, deleteNoteByIdHandler } = require('./handler.js');


const got = require('got');


const {
  ORDER_SERVICE_PORT = 4000,
  USER_SERVICE_PORT = 6000,
} = process.env;
console.log(process.env);

const orderService = `http://localhost:${ORDER_SERVICE_PORT}`;
const userService = `http://localhost:${USER_SERVICE_PORT}`;


const init = async () => {
  const server = Hapi.server({
    port: 5000,
    host: process.env.NODE_ENV !== 'production' ? 'localhost' : '0.0.0.0',
    routes: {
      cors: {
        origin: ['http://notesapp-v1.dicodingacademy.com'], // Specify the allowed origin
        credentials: true, // If you're using cookies, sessions, or other credentials
        additionalHeaders: ['x-requested-with'], // Add any additional headers if needed
        additionalExposedHeaders: ['content-type', 'authorization'], // Expose headers if needed
      },
    },
  });

  // Register routes (ensure the routes are correctly defined in the routes module)
  server.route([
    {
      method: 'POST',
      path: '/notes',
      handler: addNoteHandler,
    },
    {
      method: 'GET',
      path: '/notes',
      handler: getAllNotesHandler,
    },
    {
      method: 'GET',
      path: '/notes/{id}',
      handler: getNoteByIdHandler,
    },
    {
      method: 'PUT',
      path: '/notes/{id}',
      handler: editNoteByIdHandler,
    },
    {
      method: 'DELETE',
      path: '/notes/{id}',
      handler: deleteNoteByIdHandler,
    },

    {
      method: 'GET',
      path: '/{id}',
      handler: async (request, h) => {
        const { id } = request.params;

        try {
          const [order, user] = await Promise.all([
            got(`${orderService}/${id}`).json(),
            got(`${userService}/${id}`).json(),
          ]);

          return {
            id: order.id,
            menu: order.menu,
            user: user.name,
          };
        } catch (error) {
          if (!error.response) throw error;
          if (error.response.statusCode === 400) {
            return h.response({ message: 'bad request' }).code(400);
          }
          if (error.response.statusCode === 404) {
            return h.response({ message: 'not found' }).code(404);
          }

          throw error;
        }
      },
    },
  ]);

  await server.start();
  console.log(`Server running at: ${server.info.uri}`);
};

init();
