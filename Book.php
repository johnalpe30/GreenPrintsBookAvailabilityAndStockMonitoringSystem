<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Book extends Model
{
    protected $table = 'Book';
    protected $primaryKey = 'BookID';
    public $timestamps = false;

    protected $fillable = [
        'Title',
        'Author',
        'Edition',
        'Subject',
        'Price',
        'Quantity',
        'Staff_StaffID',
    ];

    protected $casts = [
        'Price' => 'decimal:2',
        'Quantity' => 'integer',
    ];

    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'Staff_StaffID', 'StaffID');
    }

    public function restockRequests(): HasMany
    {
        return $this->hasMany(RestockRequest::class, 'Book_BookID', 'BookID');
    }
}