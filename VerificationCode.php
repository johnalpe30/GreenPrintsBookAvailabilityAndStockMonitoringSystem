<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VerificationCode extends Model
{
    protected $table = 'Verification_Code';
    protected $primaryKey = 'CodeID';
    public $timestamps = false;

    protected $fillable = [
        'Student_StudentID',
        'Code',
        'DateTime_Generated',
        'DateTime_Expiration',
        'Verification_Status',
    ];

    protected $casts = [
        'DateTime_Generated' => 'datetime',
        'DateTime_Expiration' => 'datetime',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'Student_StudentID', 'StudentID');
    }
}