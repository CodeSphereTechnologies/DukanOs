<?php

namespace App\Services;

use App\Models\Tenant;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProductImageService
{
    /**
     * Store an uploaded product image on the public disk and return its URL.
     *
     * The browser previously sent the picked file as a base64 data URL and
     * persisted that whole string in products.image, which is a varchar(255).
     * A real photo's data URL runs to hundreds of kilobytes, so it was
     * silently truncated on MySQL/Postgres (SQLite ignores the length and
     * hid the failure). Writing the bytes to disk keeps the stored value a
     * short path.
     */
    public function store(UploadedFile $file, Tenant $tenant): string
    {
        $directory = sprintf('products/%d', $tenant->id);

        if (! Storage::disk('public')->exists($directory)) {
            Storage::disk('public')->makeDirectory($directory);
        }

        $name = sprintf(
            '%s-%s.%s',
            Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)) ?: 'image',
            Str::lower(Str::random(8)),
            $file->getClientOriginalExtension() ?: 'jpg',
        );

        $path = $file->storeAs($directory, $name, 'public');

        return Storage::disk('public')->url($path);
    }
}
