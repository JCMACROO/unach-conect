<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TutoringSession extends Model
{
    protected $table = 'tutoring_sessions';

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'student_id',
        'tutor_id',
        'subject_id',
        'status',
        'scheduled_at',
        'whatsapp_initiated',
        'created_at'
    ];

    public $timestamps = false;

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id', 'id');
    }

    public function tutor()
    {
        return $this->belongsTo(Tutor::class, 'tutor_id', 'id');
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class, 'subject_id', 'id');
    }
}
