/**
 * Virtual File System Service
 * Provides in-memory file system with CRUD operations
 */

export interface FileNode {
  name: string;
  type: 'file' | 'directory';
  content?: string;
  children?: Map<string, FileNode>;
  parent?: FileNode;
}

export interface FileSystemError {
  code: 'NOT_FOUND' | 'ALREADY_EXISTS' | 'INVALID_NAME' | 'NOT_EMPTY' | 'INVALID_OPERATION';
  message: string;
}

export class FileSystemService {
  private root: FileNode;

  constructor() {
    this.root = {
      name: '/',
      type: 'directory',
      children: new Map(),
    };
  }

  /**
   * Validates a file or directory name
   */
  private validateName(name: string): void {
    if (!name || name.trim() === '') {
      throw this.createError('INVALID_NAME', 'Name cannot be empty');
    }

    // Check for invalid characters
    const invalidChars = /[<>:"|?*\x00-\x1F]/;
    if (invalidChars.test(name)) {
      throw this.createError('INVALID_NAME', `Name contains invalid characters: ${name}`);
    }

    // Check for reserved names
    if (name === '.' || name === '..') {
      throw this.createError('INVALID_NAME', `Reserved name: ${name}`);
    }
  }

  /**
   * Splits a path into segments
   */
  private splitPath(path: string): string[] {
    return path
      .split('/')
      .filter(segment => segment && segment !== '.');
  }

  /**
   * Resolves a path to a file node
   */
  private resolvePath(path: string): FileNode | null {
    if (path === '/' || path === '') {
      return this.root;
    }

    const segments = this.splitPath(path);
    let current = this.root;

    for (const segment of segments) {
      if (!current.children) {
        return null;
      }

      const next = current.children.get(segment);
      if (!next) {
        return null;
      }

      current = next;
    }

    return current;
  }

  /**
   * Gets the parent directory path
   */
  private getParentPath(path: string): string {
    const segments = this.splitPath(path);
    if (segments.length === 0) {
      return '/';
    }
    segments.pop();
    return segments.length === 0 ? '/' : '/' + segments.join('/');
  }

  /**
   * Gets the file/directory name from path
   */
  private getNameFromPath(path: string): string {
    const segments = this.splitPath(path);
    return segments[segments.length - 1] || '';
  }

  /**
   * Creates an error object
   */
  private createError(code: FileSystemError['code'], message: string): Error {
    const error = new Error(message) as Error & FileSystemError;
    error.code = code;
    return error;
  }

  /**
   * Creates a new file
   */
  createFile(path: string, content: string = ''): void {
    const name = this.getNameFromPath(path);
    this.validateName(name);

    const parentPath = this.getParentPath(path);
    const parent = this.resolvePath(parentPath);

    if (!parent) {
      throw this.createError('NOT_FOUND', `Parent directory not found: ${parentPath}`);
    }

    if (parent.type !== 'directory') {
      throw this.createError('INVALID_OPERATION', `Parent is not a directory: ${parentPath}`);
    }

    if (parent.children!.has(name)) {
      throw this.createError('ALREADY_EXISTS', `File already exists: ${path}`);
    }

    const fileNode: FileNode = {
      name,
      type: 'file',
      content,
      parent,
    };

    parent.children!.set(name, fileNode);
  }

  /**
   * Creates a new directory
   */
  createDirectory(path: string): void {
    const name = this.getNameFromPath(path);
    this.validateName(name);

    const parentPath = this.getParentPath(path);
    const parent = this.resolvePath(parentPath);

    if (!parent) {
      throw this.createError('NOT_FOUND', `Parent directory not found: ${parentPath}`);
    }

    if (parent.type !== 'directory') {
      throw this.createError('INVALID_OPERATION', `Parent is not a directory: ${parentPath}`);
    }

    if (parent.children!.has(name)) {
      throw this.createError('ALREADY_EXISTS', `Directory already exists: ${path}`);
    }

    const dirNode: FileNode = {
      name,
      type: 'directory',
      children: new Map(),
      parent,
    };

    parent.children!.set(name, dirNode);
  }

  /**
   * Reads a file's content
   */
  readFile(path: string): string {
    const node = this.resolvePath(path);

    if (!node) {
      throw this.createError('NOT_FOUND', `File not found: ${path}`);
    }

    if (node.type !== 'file') {
      throw this.createError('INVALID_OPERATION', `Not a file: ${path}`);
    }

    return node.content || '';
  }

  /**
   * Updates a file's content
   */
  updateFile(path: string, content: string): void {
    const node = this.resolvePath(path);

    if (!node) {
      throw this.createError('NOT_FOUND', `File not found: ${path}`);
    }

    if (node.type !== 'file') {
      throw this.createError('INVALID_OPERATION', `Not a file: ${path}`);
    }

    node.content = content;
  }

  /**
   * Deletes a file or directory
   */
  delete(path: string): void {
    if (path === '/' || path === '') {
      throw this.createError('INVALID_OPERATION', 'Cannot delete root directory');
    }

    const node = this.resolvePath(path);

    if (!node) {
      throw this.createError('NOT_FOUND', `File or directory not found: ${path}`);
    }

    if (node.type === 'directory' && node.children!.size > 0) {
      throw this.createError('NOT_EMPTY', `Directory not empty: ${path}`);
    }

    const name = this.getNameFromPath(path);
    if (node.parent && node.parent.children) {
      node.parent.children.delete(name);
    }
  }

  /**
   * Renames a file or directory
   */
  rename(oldPath: string, newName: string): void {
    this.validateName(newName);

    if (oldPath === '/' || oldPath === '') {
      throw this.createError('INVALID_OPERATION', 'Cannot rename root directory');
    }

    const node = this.resolvePath(oldPath);

    if (!node) {
      throw this.createError('NOT_FOUND', `File or directory not found: ${oldPath}`);
    }

    if (!node.parent || !node.parent.children) {
      throw this.createError('INVALID_OPERATION', 'Cannot rename root directory');
    }

    if (node.parent.children.has(newName)) {
      throw this.createError('ALREADY_EXISTS', `Name already exists: ${newName}`);
    }

    const oldName = node.name;
    node.name = newName;
    node.parent.children.delete(oldName);
    node.parent.children.set(newName, node);
  }

  /**
   * Lists files and directories in a directory
   */
  listDirectory(path: string): FileNode[] {
    const node = this.resolvePath(path);

    if (!node) {
      throw this.createError('NOT_FOUND', `Directory not found: ${path}`);
    }

    if (node.type !== 'directory') {
      throw this.createError('INVALID_OPERATION', `Not a directory: ${path}`);
    }

    return Array.from(node.children!.values());
  }

  /**
   * Checks if a file or directory exists
   */
  exists(path: string): boolean {
    return this.resolvePath(path) !== null;
  }

  /**
   * Gets the type of a file system entry
   */
  getType(path: string): 'file' | 'directory' | null {
    const node = this.resolvePath(path);
    return node ? node.type : null;
  }

  /**
   * Gets the full path of a node
   */
  getPath(node: FileNode): string {
    const segments: string[] = [];
    let current: FileNode | undefined = node;

    while (current && current !== this.root) {
      segments.unshift(current.name);
      current = current.parent;
    }

    return segments.length === 0 ? '/' : '/' + segments.join('/');
  }

  /**
   * Clears the entire file system
   */
  clear(): void {
    this.root = {
      name: '/',
      type: 'directory',
      children: new Map(),
    };
  }
}

// Singleton instance
let fileSystemInstance: FileSystemService | null = null;

export const getFileSystem = (): FileSystemService => {
  if (!fileSystemInstance) {
    fileSystemInstance = new FileSystemService();
  }
  return fileSystemInstance;
};

export const resetFileSystem = (): void => {
  fileSystemInstance = null;
};
