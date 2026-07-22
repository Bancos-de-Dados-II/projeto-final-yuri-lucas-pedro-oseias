import { Usuario, UsuarioCreationAttributes } from "../models/index.ts";

export class UserRepository {
  async findByEmail(email: string): Promise<Usuario | null> {
    return Usuario.findOne({ where: { email } });
  }

  async findById(id: number): Promise<Usuario | null> {
    return Usuario.findByPk(id, {
      attributes: { exclude: ["senhaHash"] },
    });
  }

  async findAll(): Promise<Usuario[]> {
    return Usuario.findAll({
      attributes: { exclude: ["senhaHash"] },
    });
  }

  async create(data: UsuarioCreationAttributes): Promise<Usuario> {
    return Usuario.create(data);
  }
}

export const userRepository = new UserRepository();
