import bcrypt from 'bcryptjs';

const ROUNDS = 10;

export function ehHash(valor) {
  return typeof valor === 'string' && /^\$2[aby]\$/.test(valor);
}

export function gerarHash(senha) {
  return bcrypt.hash(senha, ROUNDS);
}

export function compararSenha(senha, hash) {
  return bcrypt.compare(senha, hash);
}
