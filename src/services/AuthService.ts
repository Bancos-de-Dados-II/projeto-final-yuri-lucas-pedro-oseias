import { userRepository } from "../repositories/UserRepository.ts";
import { comparePassword, generateToken } from "./security.ts";
import { sessionService } from "./sessionService.ts";
import { AppError } from "../utils/AppError.ts";

export class AuthService {
  async authenticate(data: any): Promise<any> {
    const { email, senha } = data;

    const usuario = await userRepository.findByEmail(email);
    if (!usuario) {
      throw new AppError("E-mail ou senha incorretos.", 401);
    }

    const senhaValida = await comparePassword(senha, usuario.senhaHash);
    if (!senhaValida) {
      throw new AppError("E-mail ou senha incorretos.", 401);
    }

    const token = generateToken({
      id: usuario.id,
      email: usuario.email,
      tipo: usuario.tipo,
    });

    // Salva a sessão no Redis com TTL de 24h (86400s)
    await sessionService.createSession(token, {
      userId: usuario.id,
      email: usuario.email,
      tipo: usuario.tipo,
      createdAt: new Date().toISOString(),
    }, 86400);

    const { senhaHash: _, ...usuarioSemSenha } = usuario.toJSON();

    return {
      user: usuarioSemSenha,
      token,
    };
  }

  async logout(token: string): Promise<void> {
    await sessionService.destroySession(token);
  }
}

export const authService = new AuthService();
