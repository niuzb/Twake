import { FastifyInstance, FastifyRegisterOptions } from "fastify";
import { ConsoleServiceAPI } from "../api";
import routes from "./routes";
import AuthServiceAPI from "../../../core/platform/services/auth/provider";
import UserServiceAPI from "../../user/api";

export default (
  fastify: FastifyInstance,
  options: FastifyRegisterOptions<{
    prefix: string;
    service: ConsoleServiceAPI;
    authService: AuthServiceAPI;
    userService: UserServiceAPI;
  }>,
): void => {
  fastify.log.debug("Configuring /console routes");
  fastify.register(routes, options);
};