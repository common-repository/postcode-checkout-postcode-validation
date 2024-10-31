<?php

	/*
		Plugin Name: Postcode Checkout - Postcode Validation
		Plugin URI: https://www.postcode-checkout.nl/plug-ins/standaard/wordpress-woocommerce
		Author: Postcode Checkout
		Author URI: https://www.postcode-checkout.nl/over-ons
		Description: Validate customer addresses with the Address databases of different providers in your WooCommerce store!
		Text Domain: postcodecheckout-for-woo
		Domain Path: /languages
		Version: 2.0.5
	*/

	//Load text domain
	load_plugin_textdomain('postcodecheckout-for-woo', false, plugin_basename(dirname(__FILE__)) . DIRECTORY_SEPARATOR . 'languages/');

	if(!class_exists('Pc4woo_Addressvalidation'))
	{
		class Pc4woo_Addressvalidation
		{
			public function __construct()
			{
				add_action('plugins_loaded', array($this, 'init'));
			}

			public function init()
			{
				// Checks if WooCommerce is installed.
				if(class_exists('WC_Integration'))
				{
					// Include our integration class.
					include_once 'includes/pc4woo-addressvalidation-integration.php';

					// Register the integration.
					add_filter('woocommerce_integrations', array($this, 'pc4woo_addCheckoutAddressvalidation'));
				} 
				else 
				{
					add_action('admin_notices', array($this, 'pc4woo_doShowWoocommerceError'));
				}
			}
			
			// Add our integration
			public function pc4woo_addCheckoutAddressvalidation($aIntegrations)
			{
				$aIntegrations[] = 'Pc4woo_Addressvalidation_Integration';
				return $aIntegrations;
			}
			
			public function pc4woo_doShowWoocommerceError()
			{
				echo '<div class="error"><p>Postcode Checkout Address validation requires WooCommerce to be active!</p></div>';
			}
		}

		$Pc4woo_Addressvalidation_Integration = new Pc4woo_Addressvalidation(__FILE__);

	}




?>