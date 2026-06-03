import { AttractionsController } from './attractions.controller';
import { AttractionsService } from './attractions.service';

describe('AttractionsController', () => {
  let controller: AttractionsController;
  let mockService: {
    searchAttractions: jest.Mock;
    getAttractionDetails: jest.Mock;
    getAlternatives: jest.Mock;
  };

  beforeEach(() => {
    mockService = {
      searchAttractions: jest.fn(),
      getAttractionDetails: jest.fn(),
      getAlternatives: jest.fn(),
    };
    controller = new AttractionsController(mockService as unknown as AttractionsService);
  });

  describe('searchAttractions', () => {
    it('should call searchAttractions with query parameters', async () => {
      mockService.searchAttractions.mockResolvedValue([]);
      const searchDto = { query: 'Eiffel', location: 'Paris', radius: 5000 };
      const res = await controller.searchAttractions(searchDto);
      expect(res).toEqual([]);
      expect(mockService.searchAttractions).toHaveBeenCalledWith('Eiffel', 'Paris', 5000);
    });
  });

  describe('getAttractionDetails', () => {
    it('should call getAttractionDetails with place id', async () => {
      mockService.getAttractionDetails.mockResolvedValue({ id: 'p1' });
      const res = await controller.getAttractionDetails('p1');
      expect(res).toEqual({ id: 'p1' });
      expect(mockService.getAttractionDetails).toHaveBeenCalledWith('p1');
    });
  });

  describe('getAlternatives', () => {
    it('should call getAlternatives with place id and body destination', async () => {
      mockService.getAlternatives.mockResolvedValue([]);
      const dto = { destination: 'Paris' };
      const res = await controller.getAlternatives('p1', dto);
      expect(res).toEqual([]);
      expect(mockService.getAlternatives).toHaveBeenCalledWith('p1', 'Paris');
    });
  });
});
