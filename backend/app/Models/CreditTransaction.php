<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CreditTransaction extends Model
{
    protected $table = 'credit_transactions';

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'wallet_id',
        'amount',
        'type',
        'description',
        'reference_id',
        'created_at'
    ];

    public $timestamps = false;

    public function wallet()
    {
        return $this->belongsTo(Wallet::class, 'wallet_id', 'user_id');
    }
}
