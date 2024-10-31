<?php

	if(!class_exists('Pc4woo_Addressvalidation_Integration'))
	{
		class Pc4woo_Addressvalidation_Integration extends WC_Integration
		{

			/**
			 * Init and hook in the integration.
			 */
			public function __construct()
			{
				global $woocommerce;

				$this->id = 'postcodecheckout-for-woo';
				$this->method_title = __('Postcode Checkout - Address validation', 'postcodecheckout-for-woo' );
				$this->method_description = __('Adds Postcode Checkout\'s integration of different address validation/autocomplete providers to WooCommerce for NL.', 'postcodecheckout-for-woo');

				// Load the settings.
				$this->init_form_fields();
				$this->init_settings();

				// Define user set variables.
				$this->javascriptconfig = (object) array(
					'pc4woo_enabled_checkout' => $this->get_option('pc4woo_enabled_checkout'),
					'pc4woo_hide_fields' =>	$this->get_option('pc4woo_hide_fields'),
					'pc4woo_empty_fields' =>	$this->get_option('pc4woo_empty_fields'),
					'pc4woo_housenumber_line_2' => (int)$this->get_option('pc4woo_housenumber_line_2'),
				);

				$this->phpconfig = (object) array(
					'pc4woo_license_key' =>	$this->get_option('pc4woo_license_key'),
				);

				// Actions
				// Save our settings
				add_action('woocommerce_update_options_integration_' .  $this->id, array($this, 'process_admin_options'));

				if($this->javascriptconfig->pc4woo_enabled_checkout)
				{
					add_action('woocommerce_before_checkout_form', array($this, 'pc4woo_addCheckoutJs'));
					add_action('woocommerce_before_edit_account_address_form', array($this, 'pc4woo_addCheckoutJs'));

					add_action('edit_user_profile', array($this, 'pc4woo_addProfileJs'));
					add_action('profile_personal_options', array($this, 'pc4woo_addProfileJs'));
					// add_action('add_meta_boxes', array($this, 'pc4woo_addOrdersJs'));
				}
			}

			public function init_form_fields()
			{
				$this->form_fields = array(
					'pc4woo_enabled_checkout' => array(
						'title'			 => __('Enabled', 'postcodecheckout-for-woo' ),
						'type'			  => 'select',
						'description'	   => __('Enable address lookup on the checkout and account pages', 'postcodecheckout-for-woo'),
						'desc_tip'		  => true,
						'default'		   => 1,
						'options'     => array(
							0 => __('No', 'woocommerce'),
							1 => __('Yes', 'woocommerce')
						)
					),
					'pc4woo_license_key' => array(
						'title'			=> __('License Key', 'postcodecheckout-for-woo' ),
						'type'			=> 'text',
						'description'	=> __('Enter the Postcode Checkout License Key you received by email when you signed up for an account.', 'postcodecheckout-for-woo' ),
						'desc_tip'		=> true,
						'default'		=> '',
						'placeholder'	=> 'abcdefghijklmnopqrstuvwxyz123456789'
					),
					'pc4woo_hide_fields' => array(
						'title'			=> __('Hide Address Fields', 'postcodecheckout-for-woo' ),
						'type'			=> 'select',
						'description'	=> __('Hide the address fields until a search result is selected', 'postcodecheckout-for-woo' ),
						'desc_tip'		=> true,
						'default'		=> 1,
						'options'		=> array(
							0 => __('No', 'woocommerce'),
							1 => __('Yes', 'woocommerce')
						)
					),
					'pc4woo_empty_fields' => array(
						'title'			=> __('Empty the default address fields?', 'postcodecheckout-for-woo'),
						'type'			=> 'select',
						'description'	=> __('The standard address fields can be emptied to revalidate the response from Postcode NL', 'postcodecheckout-for-woo'),
						'desc_tip'		=> true,
						'default'		=> 0,
						'options'     => array(
							0 => __('No', 'woocommerce'),
							1 => __('Yes', 'woocommerce')
						)
					),
					'pc4woo_housenumber_line_2' => array(
						'title'			=> __('Housenumber and addition on Line 2', 'postcodecheckout-for-woo' ),
						'type'			=> 'select',
						'description'	=> __('Use address line 2 for housenumber and addition', 'postcodecheckout-for-woo'),
						'desc_tip'		=> true,
						'default'		=> 0,
						'options'     => array(
							0 => __('No', 'woocommerce'),
							1 => __('Yes', 'woocommerce')
						)
					),
				);
			}

			// Add our JS for the frontend
			public function pc4woo_addScripts($sScript, $sDirectory)
			{
				$sScriptName = 'postcode-checkout';

				wp_enqueue_style($sScriptName . '-css', plugins_url('/frontend/css/autocomplete-address.css', dirname(__FILE__ )));
				wp_enqueue_script($sScriptName, plugins_url('/' . $sDirectory . '/js/' . $sScript . '.js', dirname(__FILE__)));

				// Localize the script with new data
				$aTranslations = array(
					'pc4woo_postcode_label' => __('Postcode', 'postcodecheckout-for-woo'),
					'pc4woo_number_label' => __('Number', 'postcodecheckout-for-woo'),
					'pc4woo_additions_label' => __('Ext', 'postcodecheckout-for-woo'),
					'pc4woo_manual_label' => __('Enter Address Manually', 'postcodecheckout-for-woo')
				);
				wp_localize_script($sScriptName, 'translate', $aTranslations);

				wp_add_inline_script($sScriptName, 'var pc4woo_config = ' . json_encode($this->javascriptconfig) . ';', 'before');
			}

			public function pc4woo_addCheckoutJs()
			{
				$this->pc4woo_addScripts('checkout', 'frontend');
			}

			public function pc4woo_addProfileJs()
			{
				$this->pc4woo_addScripts('profile', 'backend');
			}

			public function pc4woo_addOrdersJs()
			{
				$this->pc4woo_addScripts('orders', 'backend');
			}
		}
	}

?>