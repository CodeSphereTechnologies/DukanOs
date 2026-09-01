<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('product_specification_values', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('specification_id')->constrained('specifications')->cascadeOnDelete();
            $table->foreignId('specification_value_id')->nullable()->constrained('specification_values')->nullOnDelete();
            $table->text('value')->nullable();
            $table->timestamps();

            $table->unique(['product_id', 'specification_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_specification_values');
    }
};
