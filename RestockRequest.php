<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RestockRequest extends Model
{
    protected $table = 'Restock_Request';
    protected $primaryKey = 'RequestID';
    public $timestamps = false;

    protected $fillable = [
        'Student_StudentID',
        'Book_BookID',
        'Request_Date',
        'Notification_Status',
    ];

    protected $casts = [
        'Request_Date' => 'date',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'Student_StudentID', 'StudentID');
    }

    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class, 'Book_BookID', 'BookID');
    }
}