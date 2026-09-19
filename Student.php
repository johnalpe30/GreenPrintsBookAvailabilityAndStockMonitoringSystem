<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Student extends Model
{
    protected $table = 'Student';
    protected $primaryKey = 'StudentID';
    public $timestamps = false;

    protected $fillable = [
        'FirstName',
        'MiddleName',
        'LastName',
        'Suffix',
        'Institutional_Email',
        'Program',
    ];

    public function restockRequests(): HasMany
    {
        return $this->hasMany(RestockRequest::class, 'Student_StudentID', 'StudentID');
    }

    public function verificationCodes(): HasMany
    {
        return $this->hasMany(VerificationCode::class, 'Student_StudentID', 'StudentID');
    }
}