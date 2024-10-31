
	// var pc4woo_SupportedCountries = ['NL', 'BE', 'DE'];
	var pc4woo_SupportedCountries = ['NL'];
	var pc4woo_aCountryCode = ['billing', 'shipping'];
	var pc4woo_sHideSpeed = 'slow';
	var pc4woo_oDomElements = null;
	var pc4woo_oDomElementsFields = null;
	var sOldAddition = null;

    var alternativeFields = false;

	// Delay function
	var delay = (function ()
	{
		var timer = 0;

		return function (callback, ms)
		{
			clearTimeout(timer);
			timer = setTimeout(callback, ms);
		};
	})();


	function pc4woo_init(sSection)
	{
		if(pc4woo_isSupportedCountry(sSection))
		{
			setTimeout(function()
			{
				pc4woo_hideForm(sSection);
				pc4woo_addLookup(sSection);
			}, 100);
		}
		else
		{
			pc4woo_restoreForm(sSection);
		}
	}

	function pc4woo_addLookup(sSection)
	{
		oElements = pc4woo_getElements(sSection);

		// Manual input billing fields
		jQuery('#pc4woo-' + sSection +'-disable').on('change', function ()
		{
			var oCheckbox = document.getElementById('pc4woo-' + sSection +'-disable');

			if(oCheckbox.checked)
			{
				pc4woo_restoreForm(sSection, true);
			}
			else
			{
				pc4woo_hideForm(sSection, true);
				pc4woo_doAction(sSection);
			}
		});

		jQuery('#pc4woo-' + sSection + '-housenumber, #pc4woo-' + sSection + '-postcode').on('keyup', function ()
		{
			console.log('PC4WOO: Keyup has taken place');
			pc4woo_doAction(sSection);
		});


		jQuery('#pc4woo-' + sSection +'-housenumber-addition').on('change', function ()
		{
			var sNewAdditionValue = jQuery('#pc4woo-' + sSection +'-housenumber-addition').val();

			pc4woo_changeHousenumberAddition(sSection, sNewAdditionValue);
		});

		jQuery('#pc4woo-' + sSection +'-housenumber-free-addition').on('keyup', function ()
		{
			var sNewAdditionValue = jQuery('#pc4woo-' + sSection +'-housenumber-free-addition').val();
			console.log(sNewAdditionValue);
			pc4woo_changeHousenumberAddition(sSection, sNewAdditionValue);

		});
	}

	function pc4woo_doAction(sSection)
	{
		var sPostcode = jQuery('#pc4woo-' + sSection + '-postcode').val().replace(/\s/g, "");
		var iHousenumber = jQuery('#pc4woo-' + sSection + '-housenumber').val().replace(/(^\d+)(.*?$)/i, '$1');
		var xAddition = jQuery('#pc4woo-' + sSection + '-housenumber').val().replace(/(^\d+)(.*?$)/i, '$2');

		if(sPostcode.length >= 6 && iHousenumber.length != 0)
		{
			delay(function ()
			{
				jQuery.ajax({
					url: 'https://www.postcode-checkout.nl/api/v2/',
					type: 'POST',
					dataType: 'json',
					data: {
						sPostcode: sPostcode,
						iHousenumber: iHousenumber,
						xAddition: xAddition
					},
					success: function (data)
					{
						console.log(data);

						if(typeof data.result !== 'undefined')
						{
							if(typeof data.result.street !== 'undefined' && typeof data.result.housenumber !== 'undefined' && typeof data.result.city !== 'undefined')
							{

                                // Check if alternative fields are found
                                if(alternativeFields)
                                {
                                    jQuery('#' + sSection + '_street_name').val(data.result.street).change();
                                    jQuery('#' + sSection + '_house_number').val(data.result.housenumber).change();
                                }
                                else
                                {
                                    if(pc4woo_config.pc4woo_housenumber_line_2 > 0)
                                    {
                                        jQuery('#' + sSection + '_address_1').val(data.result.street).change();
                                        jQuery('#' + sSection + '_address_2').val(data.result.housenumber).change();
                                    }
                                    else
                                    {
                                        jQuery('#' + sSection + '_address_1').val(data.result.street + ' ' + data.result.housenumber).change();
                                        // jQuery('#' + sSection + '_address_2').val(data.result.addition ? data.result.addition : '');
                                    }    
                                }

								
								jQuery('#' + sSection + '_postcode').val(pc4woo_formatPostcode(data.result.postcode)).change();
								jQuery('#' + sSection + '_city').val(data.result.city).change();

								pc4woo_updatePreview(sSection);

								sOldAddition = null;

								if((data.provider == 'postcodeapi') || (data.result.addition) === '') {
									console.log('show free field');
									pc4woo_showFreeHouseNumberField(sSection);
								} else {
									console.log('set additions');
									pc4woo_setHouseNumberAdditions(sSection, data.result.addition);
								}

								jQuery( 'body' ).trigger( 'update_checkout' );

								jQuery('#pc4woo-' + sSection + '-postcode').css('border-color', '#69bf29');
								jQuery('#pc4woo-' + sSection + '-housenumber').css('border-color', '#69bf29');
								// jQuery('#pc4woo_' + sSection + '_result').remove();
							}
							else
							{
								jQuery('body').trigger('update_checkout');

								jQuery('#pc4woo-' + sSection + '-postcode').css('border-color', '#FF0000');
								jQuery('#pc4woo-' + sSection + '-housenumber').css('border-color', '#FF0000');
							}
						}
						else
						{

							console.log(data.message);

							jQuery('#' + sSection + '_address_1').val('').change();
							jQuery('#' + sSection + '_address_2').val('').change();
							jQuery('#' + sSection + '_postcode').val('').change();
							jQuery('#' + sSection + '_city').val('').change();

							pc4woo_setHouseNumberAdditions(sSection, []);


							if(typeof data.message !== 'undefined')
							{
								jQuery('#pc4woo_' + sSection + '_result_wrapper').html(data.message);
							}

							jQuery('body').trigger('update_checkout');

							jQuery('#pc4woo-' + sSection + '-postcode').css('border-color', '#FF0000');
							jQuery('#pc4woo-' + sSection + '-housenumber').css('border-color', '#FF0000');

						}
					}
				});
			}, 600);
		}
	}

    function pc4woo_formatPostcode(sPostcode)
    {
        sPostcode = sPostcode.replace(/(\d{4})/g, '$1 ').replace(/(^\s+|\s+$)/, '')

        return sPostcode;
    }


	function pc4woo_updatePreview(sSection)
	{
        
        // Check if alternative fields are found
        if(alternativeFields)
        {
            jQuery('#pc4woo_' + sSection + '_result_wrapper').html(
                jQuery('#' + sSection + '_street_name').val() + ' ' + jQuery('#' + sSection + '_house_number').val() + ' ' + jQuery('#' + sSection + '_house_number_suffix').val() + '<br>' + jQuery('#' + sSection + '_postcode').val() + ' ' + jQuery('#' + sSection + '_city').val());
        }
        else
        {
            if(pc4woo_config.pc4woo_housenumber_line_2 > 0)
            {
                jQuery('#pc4woo_' + sSection + '_result_wrapper').html(
                    jQuery('#' + sSection + '_address_1').val() + ' ' + jQuery('#' + sSection + '_address_2').val() + '<br>' + jQuery('#' + sSection + '_postcode').val() + ' ' + jQuery('#' + sSection + '_city').val());
            }
            else
            {
                jQuery('#pc4woo_' + sSection + '_result_wrapper').html(
                    jQuery('#' + sSection + '_address_1').val() + '<br>' + jQuery('#' + sSection + '_postcode').val() + ' ' + jQuery('#' + sSection + '_city').val());
            }
        }
		
	}

	function pc4woo_setHouseNumberAdditions(sSection, aAdditions)
	{
		jQuery('#pc4woo-' + sSection + '-housenumber-addition').empty();


		if(jQuery('#pc4woo-' + sSection + '-housenumber-addition') && jQuery(aAdditions).length > 0)
		{
			var sAdditionValue = jQuery('pc4woo-' + sSection + '-housenumber-addition').val();

			jQuery.each(aAdditions, function(key, sAddition)
			{
				jQuery('#pc4woo-' + sSection + '-housenumber-addition')
				.append(jQuery('<option>', { value : sAddition })
				.text(sAddition));
			});

			jQuery('#pc4woo_' + sSection + '_housenumber_addition_wrapper').show(pc4woo_sHideSpeed);
			jQuery('#pc4woo-' + sSection + '-housenumber-addition').val(sAdditionValue);
		}
	}

	function pc4woo_showFreeHouseNumberField(sSection)
	{
        console.log('show free field');
        jQuery('#pc4woo_' + sSection + '_housenumber_addition_wrapper').hide(pc4woo_sHideSpeed);
        jQuery('#pc4woo-' + sSection + '-housenumber-free-addition').val('');
        jQuery('#pc4woo_' + sSection + '_housenumber_free_wrapper').show(pc4woo_sHideSpeed);
        
		
	}

	function pc4woo_changeHousenumberAddition(sSection, sNewAdditionValue)
	{
		var sCurrentStreetValue = false;
		var sNewStreetvalue = false;
		var sAddition = false;

		if(sNewAdditionValue == 'undefined')
		{
			return;
		}

        // Check if alternative fields are found
        if(alternativeFields)
        {
            jQuery('#' + sSection + '_house_number_suffix').val(sNewAdditionValue);
        }
        else
        {
            if(pc4woo_config.pc4woo_housenumber_line_2 > 0)
            {
                sCurrentStreetValue = pc4woo_removeAdditionFromStreet(sSection, jQuery('#' + sSection + '_address_2').val());
    
                sAddition = (sNewAdditionValue) ? ' ' +  sNewAdditionValue.replace(/ /g,'') : '';
                sNewStreetvalue = sCurrentStreetValue + sAddition;
    
                jQuery('#' + sSection + '_address_2').val(sNewStreetvalue).change();
            }
            else
            {
                sCurrentStreetValue = pc4woo_removeAdditionFromStreet(sSection, jQuery('#' + sSection + '_address_1').val());
    
                sAddition = (sNewAdditionValue) ? ' ' +  sNewAdditionValue.replace(/ /g,'') : '';
                sNewStreetvalue = sCurrentStreetValue + sAddition;
    
                jQuery('#' + sSection + '_address_1').val(sNewStreetvalue).change();
            }
    
        }
		
		sOldAddition = sNewAdditionValue;
		pc4woo_updatePreview(sSection);

		// Force WooCommerce to recalculate shipping costs after address change
		jQuery(document.body).trigger('update_checkout');	
	}

	function pc4woo_removeAdditionFromStreet(sSection, sCurrentFieldValue)
	{
		if(sOldAddition !== null && sOldAddition && sCurrentFieldValue)
		{
			var aParts = ("" + sCurrentFieldValue).split(" ");

			if(aParts.length > 1)
			{
				aParts.pop();
			}

			sCurrentFieldValue = aParts.join(" ");

			return sCurrentFieldValue;
		}

		return sCurrentFieldValue;
	}

	function pc4woo_getElements(sSection)
	{
        if(alternativeFields)
        {
            pc4woo_oDomElements =
            {
                streetname: jQuery('#' + sSection + '_street_name'),
                housenumber: jQuery('#' + sSection + '_house_number'),
                housenumbersuffix: jQuery('#' + sSection + '_house_number_suffix'),
                postcode: jQuery('#' + sSection + '_postcode'),
                city: jQuery('#' + sSection + '_city'),
                state: jQuery('#' + sSection + '_state'),
                country: jQuery('#' + sSection + '_country')
            };
        }
        else
        {
            pc4woo_oDomElements =
            {
                address_1: jQuery('#' + sSection + '_address_1'),
                address_2: jQuery('#' + sSection + '_address_2'),
                postcode: jQuery('#' + sSection + '_postcode'),
                city: jQuery('#' + sSection + '_city'),
                state: jQuery('#' + sSection + '_state'),
                country: jQuery('#' + sSection + '_country')
            };
        }

		

		return pc4woo_oDomElements;
	}

	function pc4woo_getDomElementsFields(sSection)
	{
        if(alternativeFields)
        {

            pc4woo_oDomElementsFields =
            {
                streetname: jQuery('#' + sSection + '_street_name_field'),
                housenumber: jQuery('#' + sSection + '_house_number_field'),
                housenumbersuffix: jQuery('#' + sSection + '_house_number_suffix_field'),
                postcode: jQuery('#' + sSection + '_postcode_field_field'),
                city: jQuery('#' + sSection + '_city_field'),
                state: jQuery('#' + sSection + '_state_field'),
                postcode: jQuery('#' + sSection + '_postcode_field'),
                country: jQuery('#' + sSection + '_country_field')
            };

        }
        else
        {
            pc4woo_oDomElementsFields =
            {
                address_1: jQuery('#' + sSection + '_address_1_field'),
                address_2: jQuery('#' + sSection + '_address_2_field'),
                postcode: jQuery('#' + sSection + '_postcode_field_field'),
                city: jQuery('#' + sSection + '_city_field'),
                state: jQuery('#' + sSection + '_state_field'),
                postcode: jQuery('#' + sSection + '_postcode_field'),
                country: jQuery('#' + sSection + '_country_field')
            };
        }
		

		return pc4woo_oDomElementsFields;
	}

	function pc4woo_getCountryCode(sSection)
	{
		let sCountryCode = pc4woo_aCountryCode[sSection];

		return sCountryCode;
	}

	function pc4woo_isSupportedCountry(sSection)
	{
		let sCountryCode = pc4woo_getCountryCode(sSection);

		if(jQuery.inArray(sCountryCode, pc4woo_SupportedCountries) > -1)
		{
			return true;
		}

		return false;
	}

	function pc4woo_setFieldsLogin(sSection)
	{
		var iHousenumber;
		var sPostcode = jQuery('#' + sSection + '_postcode').val();

        // Check if alternative fields are found
        if(alternativeFields)
        {
            var sAddress1 = jQuery('#' + sSection + '_house_number').val();
            var sAddress2 = '';
        }
        else
        {
            var sAddress1 = jQuery('#' + sSection + '_address_1').val();
            var sAddress2 = jQuery('#' + sSection + '_address_2').val();
        }

		if((sAddress1 !== '' || sAddress2 !== '') && sPostcode !== '')
		{
			if(sAddress2 !== '')
			{
				var iHousenumber = sAddress2.match(/\d+/);
			}
			else
			{
				var iHousenumber = sAddress1.match(/\d+/);
			}

			jQuery('#pc4woo-' + sSection + '-postcode').val(sPostcode);
			jQuery('#pc4woo-' + sSection + '-housenumber').val(iHousenumber);
			
			pc4woo_doAction(sSection);
		}
	}

	function pc4woo_setCountryCode(oElement, sSection)
	{
		let sCountryCode = jQuery(oElement).val();
		pc4woo_aCountryCode[sSection] = sCountryCode;

		return sCountryCode;
	}

	function pc4woo_restoreForm(sSection, bCheckbox)
	{
		console.log('PC 4 WOO pc4woo_restoreForm(' + sSection + '): Form should be hidden.');

		oFields = pc4woo_getDomElementsFields(sSection);
		oElements = pc4woo_getElements(sSection);

		if(pc4woo_config.pc4woo_hide_fields > 0)
		{
			// console.log('PC 4 WOO: show FIELDS', oFields);

			var domKeys = Object.keys(oFields);

			for(var iDom = 0; iDom < domKeys.length; iDom++)
			{
				if(domKeys[iDom] != 'country')
				{
					jQuery(oFields[domKeys[iDom]]).show(pc4woo_sHideSpeed);

					// console.log('PC 4 WOO: SHOW FIELD', oFields[domKeys[iDom]]);
				}
			}

			// console.log('PC 4 WOO: SHOW the fields');
		}
		else
		{
			// Enable the input fields
			// console.log('PC 4 WOO: Enable the FIELDS', oElements);

			var domKeys = Object.keys(oElements);

			for(var iDom = 0; iDom < domKeys.length; iDom++)
			{
				if(domKeys[iDom] != 'country')
				{
					jQuery(oElements[domKeys[iDom]]).removeAttr('readonly');
					console.log('PC 4 WOO: DISABLE FIELD', oElements[domKeys[iDom]]);
				}
			}
		}

		if(typeof bCheckbox !== 'undefined')
		{
			jQuery('#pc4woo_' + sSection + '_postcode_wrapper').hide(pc4woo_sHideSpeed);
			jQuery('#pc4woo_' + sSection + '_housenumber_wrapper').hide(pc4woo_sHideSpeed);
			jQuery('#pc4woo_' + sSection + '_housenumber_addition_wrapper').hide(pc4woo_sHideSpeed);
			jQuery('#pc4woo_' + sSection + '_housenumber_free_wrapper').hide(pc4woo_sHideSpeed);
			jQuery('#pc4woo_' + sSection + '_result_wrapper').hide(pc4woo_sHideSpeed);
		}
		else
		{
			jQuery('#pc4woo_' + sSection + '_wrapper').remove();
		}
	}

	function pc4woo_hideForm(sSection, bCheckbox)
	{
		console.log('PC 4 WOO pc4woo_hideForm(' + sSection + '): Form should be shown.');

		oFields = pc4woo_getDomElementsFields(sSection);
		oElements = pc4woo_getElements(sSection);

		// Add our template to the checkout
		var sPc4wooSearchTemplate = '<span id="pc4woo_' + sSection + '_wrapper"><p id="pc4woo_' + sSection + '_postcode_wrapper" class="form-row form-row-first"><label class="" for="pc4woo-' + sSection + '-postcode-label">' + translate.pc4woo_postcode_label + ' <abbr class="required" title="verplicht">*</abbr></label><input type="text" class="input-text" name="pc4woo-' + sSection + '-postcode" id="pc4woo-' + sSection + '-postcode" placeholder="1234 AB" value=""></p><p id="pc4woo_' + sSection + '_housenumber_wrapper" class="form-row form-row-last"><label class="" for="pc4woo-' + sSection + '-housenumber-label">' + translate.pc4woo_number_label + ' <abbr class="required" title="verplicht">*</abbr></label><input type="text" class="input-text" name="pc4woo-' + sSection + '-housenumber" id="pc4woo-' + sSection + '-housenumber" placeholder="2" value=""></p><p id="pc4woo_' + sSection + '_housenumber_addition_wrapper" class="form-row form-row-wide"><label class="" for="pc4woo-' + sSection + '-housenumber-addition-label">' + translate.pc4woo_additions_label + '</label><select type="select" class="input-text" name="pc4woo-' + sSection + '-housenumber-addition" id="pc4woo-' + sSection + '-housenumber-addition" value=""></select></p><p id="pc4woo_' + sSection + '_housenumber_free_wrapper" class="form-row form-row-wide"><label class="" for="pc4woo-' + sSection + '-housenumber-free-label">' + translate.pc4woo_additions_label + '</label><input type="text" class="input-text" name="pc4woo-' + sSection + '-housenumber-free-addition" id="pc4woo-' + sSection + '-housenumber-free-addition" value=""></p><p class="form-row form-row-wide pc4woo_' + sSection + '_result_wrapper" id="pc4woo_' + sSection + '_result_wrapper"></p><p class="form-row form-row-wide pc4woo_' + sSection + '_disable_wrapper" id="pc4woo_' + sSection + '_disable_wrapper"><label class="" for="pc4woo-disable-label">' + translate.pc4woo_manual_label + '</label><input type="checkbox" class="input-checkbox" name="pc4woo-disable" id="pc4woo-' + sSection +'-disable" value=""></p></span>';

		if(!jQuery('#pc4woo_' + sSection + '_wrapper').length)
		{
			jQuery(oFields.country).after(sPc4wooSearchTemplate);
		}

		if(typeof bCheckbox !== 'undefined')
		{
			// Wrapper is there, show fields
			jQuery('#pc4woo_' + sSection + '_postcode_wrapper').show(pc4woo_sHideSpeed);
			jQuery('#pc4woo_' + sSection + '_housenumber_wrapper').show(pc4woo_sHideSpeed);
			jQuery('#pc4woo_' + sSection + '_result_wrapper').show(pc4woo_sHideSpeed);
		}

		// Always hide addition fields
		jQuery('#pc4woo_' + sSection + '_housenumber_addition_wrapper').hide(pc4woo_sHideSpeed);
		jQuery('#pc4woo_' + sSection + '_housenumber_free_wrapper').hide(pc4woo_sHideSpeed);

		// Check if user is logged in, then fill fields with already filled info
		if(jQuery('body').hasClass('logged-in'))
		{
			pc4woo_setFieldsLogin(sSection);
		}

		if(pc4woo_config.pc4woo_hide_fields > 0)
		{
			// console.log('PC 4 WOO: hide FIELDS', oFields);

			var domKeys = Object.keys(oFields);

			for(var iDom = 0; iDom < domKeys.length; iDom++)
			{
				if(domKeys[iDom] != 'country')
				{
					if(pc4woo_config.pc4woo_empty_fields > 0)
					{
						jQuery(oFields[domKeys[iDom]]).attr('value', '');
					}

					jQuery(oFields[domKeys[iDom]]).hide(pc4woo_sHideSpeed);
					// console.log('PC 4 WOO: HIDE FIELD', oFields[domKeys[iDom]]);
				}
			}

			// console.log('PC 4 WOO: HIDE the fields');
		}
		else
		{
			// Disable the input fields
			// console.log('PC 4 WOO: disable the FIELDS', oElements);

			var domKeys = Object.keys(oElements);

			for(var iDom = 0; iDom < domKeys.length; iDom++)
			{
				if(domKeys[iDom] != 'country')
				{
					if(pc4woo_config.pc4woo_empty_fields > 0)
					{
						jQuery(oFields[domKeys[iDom]]).attr('value', '');
					}

					jQuery(oElements[domKeys[iDom]]).attr('readonly', '');
					// console.log('PC 4 WOO: ENABLE FIELD', oElements[domKeys[iDom]]);
				}
			}
		}

		// Force WooCommerce to recalculate shipping costs after address change
		jQuery(document.body).trigger('update_checkout');
	}


    function enableShipping()
    {
        // Shipping address should be active
        sSection = 'shipping';
        oElement = jQuery('#' + sSection + '_country');
        pc4woo_setCountryCode(oElement, sSection);
        pc4woo_init(sSection);

        // If country selectbox changes for Shipping
        jQuery(oElement).on('change', function ()
        {
            let sSection = 'shipping';
            pc4woo_setCountryCode(this, sSection);
            pc4woo_init(sSection);
        });
    }



	jQuery(document).ready(function ()
	{
		// Is the checkout validation enabled?
		if(!pc4woo_config.pc4woo_enabled_checkout)
		{
			console.log('PC 4 WOO: disabled.');
			return false;
		}

		let sSection = '';
		let oElement = '';

		// Lookup for Billing
		sSection = 'billing';

        // Check for alternative fields
        if(jQuery('#' + sSection + '_street_name').length)
        {
            // We have an alternative field
            alternativeFields = true;
        }

		oElement = jQuery('#' + sSection + '_country');
		pc4woo_setCountryCode(oElement, sSection);
		pc4woo_init(sSection);

        
		// If country selectbox changes for Billing
		jQuery(oElement).on('change', function ()
		{
			let sSection = 'billing';
			pc4woo_setCountryCode(this, sSection);
			pc4woo_init(sSection);
		});

		// Lookup for Shipping

		setTimeout(function ()
		{
            // Check if the shipping address checkbox is checked
            if(jQuery('#ship-to-different-address-checkbox').is(':checked'))
            {
                enableShipping();
            }

            // Watch for on change
            jQuery('#ship-to-different-address-checkbox').on('change', function ()
            {
                if(jQuery('#ship-to-different-address-checkbox').is(':checked'))
                {
                    enableShipping();

                }
            });
			
		}, 1000);
	});