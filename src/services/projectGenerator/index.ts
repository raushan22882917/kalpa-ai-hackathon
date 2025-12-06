/**
 * AI Project Generator - Core exports
 * 
 * This module provides all the core types, data, and utilities
 * for the AI Project Generator feature.
 */

// Types
export * from '../../types/projectGenerator';

// Predefined data
export { PREDEFINED_STACKS } from '../../data/predefinedStacks';
export { PREDEFINED_THEMES } from '../../data/predefinedThemes';

// Utilities
export * from '../../utils/sessionStorage';

// Services
export {
  getProjectGenerator,
  resetProjectGenerator,
  ProjectGeneratorService,
  type Phase,
  type DocumentType,
} from '../projectGeneratorService';
export { getContextManager, resetContextManager } from '../contextManagerService';
export { default as planCreatorService } from '../planCreatorService';
