<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RedemptionCode extends Model
{
    protected $table = 'redemption_codes';

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'transaction_id',
        'code',
        'status',
        'partner_shop_id',
        'expires_at',
        'claimed_at'
    ];

    public $timestamps = false;

    public function transaction()
    {
        return $this->belongsTo(CreditTransaction::class, 'transaction_id', 'id');
    }

    public function partner()
    {
        return $this->belongsTo(User::class, 'partner_shop_id', 'id');
    }
}
