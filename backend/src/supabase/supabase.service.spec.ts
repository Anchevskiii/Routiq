import { createClient } from '@supabase/supabase-js';
import { AppConfigService } from '../config/config.service';
import { SupabaseService } from './supabase.service';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

describe('SupabaseService', () => {
  let mockConfigService: {
    getSupabaseUrl: jest.Mock;
    getSupabaseServiceRoleKey: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockConfigService = {
      getSupabaseUrl: jest.fn().mockReturnValue('https://supabase.co'),
      getSupabaseServiceRoleKey: jest.fn().mockReturnValue('service-key'),
    };
  });

  it('should initialize supabase client if url and key are provided', () => {
    const mockClient = {};
    (createClient as jest.Mock).mockReturnValue(mockClient);

    const service = new SupabaseService(mockConfigService as unknown as AppConfigService);
    expect(createClient).toHaveBeenCalledWith(
      'https://supabase.co',
      'service-key',
      expect.any(Object),
    );
    expect(service.getClient()).toBe(mockClient);
  });

  it('should not initialize supabase client if url or key is missing', () => {
    mockConfigService.getSupabaseUrl.mockReturnValue(null);
    const service = new SupabaseService(mockConfigService as unknown as AppConfigService);
    expect(createClient).not.toHaveBeenCalled();
    expect(service.getClient()).toBeUndefined();
  });
});
