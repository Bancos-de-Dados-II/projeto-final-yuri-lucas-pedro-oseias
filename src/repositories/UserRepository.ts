import { Usuario, UsuarioCreationAttributes, UsuarioAttributes } from "../models/index.ts";

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
      order: [["id", "ASC"]],
    });
  }

  async create(data: UsuarioCreationAttributes): Promise<Usuario> {
    return Usuario.create(data);
  }

  async update(id: number, data: Partial<UsuarioAttributes>): Promise<Usuario | null> {
    const usuario = await Usuario.findByPk(id);
    if (!usuario) return null;
    await usuario.update(data);
    return usuario;
  }

  async delete(id: number): Promise<boolean> {
    const usuario = await Usuario.findByPk(id);
    if (!usuario) return false;
    await usuario.destroy();
    return true;
  }
}

export const userRepository = new UserRepository();
