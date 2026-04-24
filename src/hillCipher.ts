/**
 * Hill Cipher Mathematical Logic
 * Handles 2x2 and 3x3 matrices with step-by-step detail generation
 */

export interface MatrixStep {
  title: string;
  description: string;
  math?: string;
  matrix?: number[][];
  result?: string | number | number[][];
  type: 'text' | 'mapping' | 'blocks' | 'multiplication' | 'mod' | 'final';
}

export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

export function charToNum(char: string): number {
  return ALPHABET.indexOf(char.toUpperCase());
}

export function numToChar(num: number): string {
  return ALPHABET[mod(num, 26)];
}

export function getDeterminant(matrix: number[][]): number {
  const n = matrix.length;
  if (n === 2) {
    return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
  } else if (n === 3) {
    return (
      matrix[0][0] * (matrix[1][1] * matrix[2][2] - matrix[1][2] * matrix[2][1]) -
      matrix[0][1] * (matrix[1][0] * matrix[2][2] - matrix[1][2] * matrix[2][0]) +
      matrix[0][2] * (matrix[1][0] * matrix[2][1] - matrix[1][1] * matrix[2][0])
    );
  }
  return 0;
}

export function modInverse(a: number, m: number): number {
  a = mod(a, m);
  for (let x = 1; x < m; x++) {
    if (mod(a * x, m) === 1) {
      return x;
    }
  }
  return -1;
}

export function getAdjugate(matrix: number[][]): number[][] {
  const n = matrix.length;
  if (n === 2) {
    return [
      [matrix[1][1], -matrix[0][1]],
      [-matrix[1][0], matrix[0][0]],
    ];
  } else {
    // 3x3 Co-factor matrix then transpose
    const adj: number[][] = Array(3).fill(0).map(() => Array(3).fill(0));
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const sub: number[] = [];
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            if (r !== i && c !== j) sub.push(matrix[r][c]);
          }
        }
        const cofactor = sub[0] * sub[3] - sub[1] * sub[2];
        adj[j][i] = ((i + j) % 2 === 0 ? 1 : -1) * cofactor; // Transpose included (adj[j][i])
      }
    }
    return adj;
  }
}

export function getMatrixInverse(matrix: number[][]): number[][] | null {
  const det = getDeterminant(matrix);
  const detMod26 = mod(det, 26);
  const detInv = modInverse(detMod26, 26);

  if (detInv === -1) return null;

  const adj = getAdjugate(matrix);
  return adj.map(row => row.map(val => mod(val * detInv, 26)));
}

export function multiplyMatrixVector(matrix: number[][], vector: number[]): number[] {
  return matrix.map(row =>
    row.reduce((sum, val, i) => sum + val * vector[i], 0)
  );
}
