<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tutor extends Model
{
    protected $table = 'tutors';

    // Key is UUID string, not auto-incrementing integer
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'bio',
        'portfolio_url',
        'status',
        'rating_avg'
    ];

    public $timestamps = false;

    public function user()
    {
        return $this->belongsTo(User::class, 'id', 'id');
    }

    public function subjects()
    {
        return $this->hasMany(TutorSubject::class, 'tutor_id', 'id');
    }
}
