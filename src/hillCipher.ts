/**
 * Hill Cipher Mathematical Logic
 * Handles NxN matrices (up to 5x5) with recursive calculations
 */

import React from 'react';

export interface MatrixStep {
  title: string;
  description: string | React.ReactNode;
  math?: string;
  matrix?: number[][];
  result?: string | React.ReactNode;
  type: 'text' | 'mapping' | 'blocks' | 'multiplication' | 'mod' | 'final' | 'det' | 'inv';
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

/**
 * Gets the minor of a matrix by removing specified row and column
 */
export function getSubMatrix(matrix: number[][], row: number, col: number): number[][] {
  return matrix
    .filter((_, r) => r !== row)
    .map(r => r.filter((_, c) => c !== col));
}

/**
 * Recursive Determinant using Laplace Expansion
 */
export function getDeterminant(matrix: number[][]): number {
  const n = matrix.length;
  if (n === 1) return matrix[0][0];
  if (n === 2) return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];

  let det = 0;
  for (let j = 0; j < n; j++) {
    det += (j % 2 === 0 ? 1 : -1) * matrix[0][j] * getDeterminant(getSubMatrix(matrix, 0, j));
  }
  return det;
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

/**
 * Gets the Adjugate (Transposed Cofactor Matrix)
 */
export function getAdjugate(matrix: number[][]): number[][] {
  const n = matrix.length;
  const adj: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));

  if (n === 1) return [[1]];

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const sub = getSubMatrix(matrix, i, j);
      const cofactor = ((i + j) % 2 === 0 ? 1 : -1) * getDeterminant(sub);
      adj[j][i] = cofactor; // Transpose: element (i,j) of cofactor matrix is (j,i) of adjugate
    }
  }
  return adj;
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
