<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TutorSubject extends Model
{
    protected $table = 'tutor_subjects';

    // Disable auto-incrementing key, composite key used
    public $incrementing = false;
    protected $primaryKey = ['tutor_id', 'subject_id', 'professor_id'];

    protected $fillable = [
        'tutor_id',
        'subject_id',
        'professor_id',
        'price_per_hour'
    ];

    public $timestamps = false;

    public function tutor()
    {
        return $this->belongsTo(Tutor::class, 'tutor_id', 'id');
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class, 'subject_id', 'id');
    }

    public function professor()
    {
        return $this->belongsTo(Professor::class, 'professor_id', 'id');
    }
}
