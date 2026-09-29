<?php

namespace App\Http\Requests\Catalog;

use App\Http\Requests\ApiRequest;

class ProductImageUploadRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'image' => ['required', 'file', 'image', 'max:4096'],
        ];
    }

    public function messages(): array
    {
        return [
            'image.required' => 'Please choose an image file to upload.',
            'image.image' => 'The uploaded file must be an image (JPG, PNG, WEBP or GIF).',
            'image.max' => 'The image may not be larger than 4 MB.',
        ];
    }
}
