import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CreateProductPage } from '../../features/products/pages/CreateProductPage';
import { EditProductPage } from '../../features/products/pages/EditProductPage';
import { productService } from '../../services/product.service';

const categories = [{ id: 1, name: 'Lighting', slug: 'lighting' } as never];
const brands = [{ id: 1, name: 'Philips', slug: 'philips' } as never];

function makeFile(name = 'fan.png', bytes = 64) {
  return new File([new Uint8Array(bytes)], name, { type: 'image/png' });
}

function pickFile(input: HTMLInputElement, file: File) {
  fireEvent.change(input, { target: { files: [file] } });
}

describe('product image upload', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(productService, 'getCategories').mockResolvedValue({
      success: true,
      status: 200,
      data: categories,
    } as never);
    vi.spyOn(productService, 'getBrands').mockResolvedValue({
      success: true,
      status: 200,
      data: brands,
    } as never);
  });

  it('uploads a picked file and stores the URL the server returns', async () => {
    // Regression: the file was read into a base64 data URL and saved straight
    // into products.image, a varchar(255). A real photo's data URL is hundreds
    // of KB, so it was truncated on MySQL/Postgres and the image never showed.
    const upload = vi
      .spyOn(productService, 'uploadImage')
      .mockResolvedValue('http://localhost:8000/storage/products/1/fan-abc.png');
    const save = vi.spyOn(productService, 'saveProduct').mockResolvedValue({ id: 1 } as never);

    render(
      <MemoryRouter>
        <CreateProductPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText('Add Product')).toBeInTheDocument());

    pickFile(document.querySelector('input[type="file"]') as HTMLInputElement, makeFile());

    await waitFor(() =>
      expect(screen.getByRole('img', { name: 'Product preview' })).toHaveAttribute(
        'src',
        'http://localhost:8000/storage/products/1/fan-abc.png'
      )
    );
    expect(upload).toHaveBeenCalledTimes(1);
    expect(upload.mock.calls[0][0].name).toBe('fan.png');

    fireEvent.change(screen.getByPlaceholderText("e.g. Royal Deluxe Fan 56''"), { target: { value: 'Fan' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. ROY-FAN-56'), { target: { value: 'FAN-1' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. 9500'), { target: { value: '100' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Product' }));

    await waitFor(() => expect(save).toHaveBeenCalled());
    expect(save.mock.calls[0][0].image_url).toBe('http://localhost:8000/storage/products/1/fan-abc.png');
    // The data URL must never be what gets persisted.
    expect(String(save.mock.calls[0][0].image_url)).not.toMatch(/^data:/);
  });

  it('saves a pasted image URL as typed', async () => {
    const upload = vi.spyOn(productService, 'uploadImage');
    const save = vi.spyOn(productService, 'saveProduct').mockResolvedValue({ id: 1 } as never);

    render(
      <MemoryRouter>
        <CreateProductPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText('Add Product')).toBeInTheDocument());

    const url = 'https://cdn.example.com/fan.png';
    fireEvent.change(screen.getByPlaceholderText('or paste image URL...'), { target: { value: url } });

    fireEvent.change(screen.getByPlaceholderText("e.g. Royal Deluxe Fan 56''"), { target: { value: 'Fan' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. ROY-FAN-56'), { target: { value: 'FAN-1' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. 9500'), { target: { value: '100' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Product' }));

    await waitFor(() => expect(save).toHaveBeenCalled());
    expect(save.mock.calls[0][0].image_url).toBe(url);
    expect(upload).not.toHaveBeenCalled();
  });

  it('surfaces an upload failure instead of silently dropping the image', async () => {
    vi.spyOn(productService, 'uploadImage').mockRejectedValue(new Error('The image may not be larger than 4 MB.'));

    render(
      <MemoryRouter>
        <CreateProductPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText('Add Product')).toBeInTheDocument());

    pickFile(document.querySelector('input[type="file"]') as HTMLInputElement, makeFile());

    await waitFor(() => expect(screen.getByText(/larger than 4 MB/)).toBeInTheDocument());
  });

  it('uploads a replacement image on the edit form', async () => {
    const upload = vi
      .spyOn(productService, 'uploadImage')
      .mockResolvedValue('http://localhost:8000/storage/products/1/fan-new.png');
    vi.spyOn(productService, 'getById').mockResolvedValue({
      id: 1,
      name: 'Fan',
      sku: 'FAN-1',
      unit: 'pc',
      selling_price: 100,
      current_stock: 4,
      status: 'active',
      image_url: 'http://localhost:8000/storage/products/1/fan-old.png',
    } as never);

    render(
      <MemoryRouter initialEntries={['/products/1/edit']}>
        <EditProductPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByPlaceholderText('or paste image URL...')).toHaveValue(
      'http://localhost:8000/storage/products/1/fan-old.png'
    ));

    pickFile(document.querySelector('input[type="file"]') as HTMLInputElement, makeFile('fan-new.png'));

    await waitFor(() =>
      expect(screen.getByPlaceholderText('or paste image URL...')).toHaveValue(
        'http://localhost:8000/storage/products/1/fan-new.png'
      )
    );
    expect(upload).toHaveBeenCalledTimes(1);
  });

  it('offers a Description field on both forms', async () => {
    const save = vi.spyOn(productService, 'saveProduct').mockResolvedValue({ id: 1 } as never);

    const { unmount } = render(
      <MemoryRouter>
        <CreateProductPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText('Add Product')).toBeInTheDocument());
    const createBox = screen.getByPlaceholderText('Optional product description...');

    fireEvent.change(createBox, { target: { value: 'Quiet and efficient' } });
    fireEvent.change(screen.getByPlaceholderText("e.g. Royal Deluxe Fan 56''"), { target: { value: 'Fan' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. ROY-FAN-56'), { target: { value: 'FAN-1' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. 9500'), { target: { value: '100' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Product' }));
    await waitFor(() => expect(save).toHaveBeenCalled());
    expect(save.mock.calls[0][0].description).toBe('Quiet and efficient');
    unmount();

    vi.spyOn(productService, 'getById').mockResolvedValue({
      id: 1,
      name: 'Fan',
      sku: 'FAN-1',
      unit: 'pc',
      selling_price: 100,
      current_stock: 4,
      status: 'active',
      description: 'Quiet and efficient',
    } as never);

    render(
      <MemoryRouter initialEntries={['/products/1/edit']}>
        <EditProductPage />
      </MemoryRouter>
    );
    await waitFor(() =>
      expect(screen.getByPlaceholderText('Optional product description...')).toHaveValue('Quiet and efficient')
    );
  });
});
