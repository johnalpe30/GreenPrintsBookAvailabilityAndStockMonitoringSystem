<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Staff extends Model
{
    protected $table = 'Staff';
    protected $primaryKey = 'StaffID';
    public $timestamps = false;

    protected $fillable = [
        'FullName',
        'Username',
        'Password',
    ];

    protected $hidden = [
        'Password',
    ];

    public function books(): HasMany
    {
        return $this->hasMany(Book::class, 'Staff_StaffID', 'StaffID');
    }
}