import { Request, Response } from 'express';
import prisma from '../config/database';

/**
 * Get all categories
 * GET /api/v1/categories
 */
export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
    res.status(200).json({ data: categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch categories' } });
  }
};

/**
 * Create a category (admin only)
 * POST /api/v1/categories
 */
export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
      return;
    }

    const { name, slug, description } = req.body;

    if (!name || !slug) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Name and slug are required' } });
      return;
    }

    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
      res.status(409).json({ error: { code: 'CONFLICT', message: 'Category with this slug already exists' } });
      return;
    }

    const category = await prisma.category.create({
      data: { name, slug, description }
    });

    res.status(201).json({ message: 'Category created successfully', data: category });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to create category' } });
  }
};

/**
 * Delete a category (admin only)
 * DELETE /api/v1/categories/:id
 */
export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
      return;
    }

    const categoryId = parseInt(req.params.id as string);
    if (isNaN(categoryId)) {
      res.status(400).json({ error: { code: 'INVALID_ID', message: 'Invalid category ID' } });
      return;
    }

    const existing = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!existing) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Category not found' } });
      return;
    }

    await prisma.category.delete({ where: { id: categoryId } });
    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to delete category' } });
  }
};
