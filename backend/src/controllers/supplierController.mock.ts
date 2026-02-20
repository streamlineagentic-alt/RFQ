import { Request, Response } from 'express';
import { validationResult } from 'express-validator';

// Mock supplier database (in-memory)
const mockSuppliers: any[] = [
  {
    id: 1,
    companyName: 'Global Manufacturing Co.',
    contactName: 'John Smith',
    email: 'john@globalmanuf.com',
    phone: '+1-555-0101',
    website: 'https://globalmanuf.com',
    address: '123 Industrial Ave, New York, NY 10001, USA',
    country: 'USA',
    categories: [1, 2], // Industrial Equipment, Office Supplies
    regions: ['North America', 'Europe'],
    certifications: ['ISO 9001', 'ISO 14001'],
    isActive: true,
    rating: 4.5,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: 2,
    companyName: 'Asian Tech Solutions',
    contactName: 'Li Wei',
    email: 'liwei@asiantech.com',
    phone: '+86-10-12345678',
    website: 'https://asiantech.com',
    address: 'Building 5, Tech Park, Beijing, China',
    country: 'China',
    categories: [4], // Electronics
    regions: ['Asia', 'North America'],
    certifications: ['ISO 9001', 'RoHS'],
    isActive: true,
    rating: 4.8,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01')
  },
  {
    id: 3,
    companyName: 'European Materials Ltd',
    contactName: 'Hans Mueller',
    email: 'hans@eurmat.de',
    phone: '+49-30-9876543',
    website: 'https://eurmat.de',
    address: 'Hauptstrasse 45, Berlin, Germany',
    country: 'Germany',
    categories: [3], // Raw Materials
    regions: ['Europe', 'Middle East'],
    certifications: ['ISO 9001', 'ISO 50001'],
    isActive: true,
    rating: 4.3,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20')
  }
];

let nextSupplierId = 4;

export const createSupplier = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: errors.array()
        }
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
      return;
    }

    const supplier = {
      id: nextSupplierId++,
      ...req.body,
      isActive: true,
      rating: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockSuppliers.push(supplier);

    res.status(201).json({
      message: 'Supplier created successfully (MOCK)',
      data: supplier
    });
  } catch (error) {
    console.error('Create supplier error:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to create supplier'
      }
    });
  }
};

export const getSuppliers = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
      return;
    }

    const {
      country,
      categoryId,
      region,
      page = '1',
      limit = '20'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    // Filter suppliers
    let filteredSuppliers = [...mockSuppliers];

    if (country) {
      filteredSuppliers = filteredSuppliers.filter(s =>
        s.country.toLowerCase() === (country as string).toLowerCase()
      );
    }

    if (categoryId) {
      const catId = parseInt(categoryId as string);
      filteredSuppliers = filteredSuppliers.filter(s =>
        s.categories && s.categories.includes(catId)
      );
    }

    if (region) {
      filteredSuppliers = filteredSuppliers.filter(s =>
        s.regions && s.regions.some((r: string) =>
          r.toLowerCase() === (region as string).toLowerCase()
        )
      );
    }

    const total = filteredSuppliers.length;
    const start = (pageNum - 1) * limitNum;
    const paginatedSuppliers = filteredSuppliers.slice(start, start + limitNum);

    res.status(200).json({
      message: 'Suppliers fetched (MOCK)',
      data: paginatedSuppliers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch suppliers'
      }
    });
  }
};

export const getSupplierById = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
      return;
    }

    const { id } = req.params;
    const supplierId = parseInt(id);

    if (isNaN(supplierId)) {
      res.status(400).json({
        error: {
          code: 'INVALID_ID',
          message: 'Invalid supplier ID'
        }
      });
      return;
    }

    const supplier = mockSuppliers.find(s => s.id === supplierId);

    if (!supplier) {
      res.status(404).json({
        error: {
          code: 'SUPPLIER_NOT_FOUND',
          message: 'Supplier not found'
        }
      });
      return;
    }

    res.status(200).json({
      message: 'Supplier fetched (MOCK)',
      data: supplier
    });
  } catch (error) {
    console.error('Get supplier error:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch supplier'
      }
    });
  }
};

export const updateSupplier = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: errors.array()
        }
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
      return;
    }

    const { id } = req.params;
    const supplierId = parseInt(id);

    if (isNaN(supplierId)) {
      res.status(400).json({
        error: {
          code: 'INVALID_ID',
          message: 'Invalid supplier ID'
        }
      });
      return;
    }

    const supplierIndex = mockSuppliers.findIndex(s => s.id === supplierId);

    if (supplierIndex === -1) {
      res.status(404).json({
        error: {
          code: 'SUPPLIER_NOT_FOUND',
          message: 'Supplier not found'
        }
      });
      return;
    }

    const supplier = mockSuppliers[supplierIndex];

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        supplier[key] = req.body[key];
      }
    });

    supplier.updatedAt = new Date();

    res.status(200).json({
      message: 'Supplier updated successfully (MOCK)',
      data: supplier
    });
  } catch (error) {
    console.error('Update supplier error:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to update supplier'
      }
    });
  }
};

export const deleteSupplier = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
      return;
    }

    const { id } = req.params;
    const supplierId = parseInt(id);

    if (isNaN(supplierId)) {
      res.status(400).json({
        error: {
          code: 'INVALID_ID',
          message: 'Invalid supplier ID'
        }
      });
      return;
    }

    const supplierIndex = mockSuppliers.findIndex(s => s.id === supplierId);

    if (supplierIndex === -1) {
      res.status(404).json({
        error: {
          code: 'SUPPLIER_NOT_FOUND',
          message: 'Supplier not found'
        }
      });
      return;
    }

    mockSuppliers.splice(supplierIndex, 1);

    res.status(200).json({
      message: 'Supplier deleted successfully (MOCK)'
    });
  } catch (error) {
    console.error('Delete supplier error:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to delete supplier'
      }
    });
  }
};

// Export mock suppliers for matching algorithm
export const getMockSuppliers = () => mockSuppliers;
