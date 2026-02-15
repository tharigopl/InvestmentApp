const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');


const Schema = mongoose.Schema;

const stripeUserSchema = new Schema({
  
  //image: { type: String, required: true },
  
    "id": {
      "type": "String"
    },
    "object": {
      "type": "String"
    },
    "business_profile": {
      "mcc": {
        "type": "Mixed"
      },
      "name": {
        "type": "String"
      },
      "product_description": {
        "type": "Mixed"
      },
      "support_address": {
        "type": "Mixed"
      },
      "support_email": {
        "type": "Mixed"
      },
      "support_phone": {
        "type": "Mixed"
      },
      "support_url": {
        "type": "Mixed"
      },
      "url": {
        "type": "Mixed"
      }
    },
    "capabilities": {
      "card_payments": {
        "type": "String"
      },
      "transfers": {
        "type": "String"
      }
    },
    "charges_enabled": {
      "type": "Boolean"
    },
    "controller": {
      "type": {
        "type": "String"
      },
      "is_controller": {
        "type": "Boolean"
      }
    },
    "country": {
      "type": "String"
    },
    "created": {
      "type": "Number"
    },
    "default_currency": {
      "type": "String"
    },
    "details_submitted": {
      "type": "Boolean"
    },
    "email": {
      "type": "String", "required":"true", "unique":"true"
    },
    "external_accounts": {
      "object": {
        "type": "String"
      },
      "data": {
        "type": "Array"
      },
      "has_more": {
        "type": "Boolean"
      },
      "url": {
        "type": "String"
      }
    },
    "future_requirements": {
      "alternatives": {
        "type": "Array"
      },
      "current_deadline": {
        "type": "Mixed"
      },
      "currently_due": {
        "type": "Array"
      },
      "disabled_reason": {
        "type": "Mixed"
      },
      "errors": {
        "type": "Array"
      },
      "eventually_due": {
        "type": "Array"
      },
      "past_due": {
        "type": "Array"
      },
      "pending_verification": {
        "type": "Array"
      }
    },
    "metadata": {},
    "payouts_enabled": {
      "type": "Boolean"
    },
    "requirements": {
      "alternatives": {
        "type": "Array"
      },
      "current_deadline": {
        "type": "Mixed"
      },
      "currently_due": {
        "type": [
          "String"
        ]
      },
      "disabled_reason": {
        "type": "String"
      },
      "errors": {
        "type": "Array"
      },
      "eventually_due": {
        "type": [
          "String"
        ]
      },
      "past_due": {
        "type": [
          "String"
        ]
      },
      "pending_verification": {
        "type": "Array"
      }
    },
    "settings": {
      "bacs_debit_payments": {},
      "branding": {
        "icon": {
          "type": "Mixed"
        },
        "logo": {
          "type": "Mixed"
        },
        "primary_color": {
          "type": "Mixed"
        },
        "secondary_color": {
          "type": "Mixed"
        }
      },
      "card_issuing": {
        "tos_acceptance": {
          "date": {
            "type": "Mixed"
          },
          "ip": {
            "type": "Mixed"
          }
        }
      },
      "card_payments": {
        "decline_on": {
          "avs_failure": {
            "type": "Boolean"
          },
          "cvc_failure": {
            "type": "Boolean"
          }
        },
        "statement_descriptor_prefix": {
          "type": "Mixed"
        },
        "statement_descriptor_prefix_kanji": {
          "type": "Mixed"
        },
        "statement_descriptor_prefix_kana": {
          "type": "Mixed"
        }
      },
      "dashboard": {
        "display_name": {
          "type": "String"
        },
        "timezone": {
          "type": "String"
        }
      },
      "payments": {
        "statement_descriptor": {
          "type": "Mixed"
        },
        "statement_descriptor_kana": {
          "type": "Mixed"
        },
        "statement_descriptor_kanji": {
          "type": "Mixed"
        }
      },
      "payouts": {
        "debit_negative_balances": {
          "type": "Boolean"
        },
        "schedule": {
          "delay_days": {
            "type": "Number"
          },
          "interval": {
            "type": "String"
          }
        },
        "statement_descriptor": {
          "type": "Mixed"
        }
      },
      "sepa_debit_payments": {}
    },
    "tos_acceptance": {
      "date": {
        "type": "Mixed"
      },
      "ip": {
        "type": "Mixed"
      },
      "user_agent": {
        "type": "Mixed"
      }
    },
    "type": {
      "type": "String"
    },
    "accountlink": { type: mongoose.Types.ObjectId, ref: 'StripeUserAccountLink' }
  
});

stripeUserSchema.plugin(uniqueValidator);

module.exports = mongoose.model('StripeUser', stripeUserSchema);
