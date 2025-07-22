export const accessibilityRouteHandlers = [
  {
    method: "GET",
    path: '/accessibility',
    options: {
      auth: false,
      handler: async (_, h) => {
        return h.view("accessibility");
      },
    },
  },
];
