$(document).ready(function() {
	//this adds the .expandable() function to JQuery
		$.fn.extend({
			toHTMLString: function() {
				return $("<div>").append(this.clone()).html();
			},
			expandable: function(closed, callback) {
				// Makes a fieldset expandable
				$(this).each(function() { 	
					var legend = $(this).children('legend:first');				
					$(legend).css('cursor', 'pointer');
					$(legend).siblings().wrapAll('<div class="expdContainer" />');
					
					if(closed) {
						$(legend).data('open', false);
						$(legend).append('<span> (+)</span>');	
						$(legend).siblings().hide();		
					} else {
						$(legend).data('open', true);
						$(legend).append('<span> (-)</span>');		
					}
						
					$(legend).click(function() {					
						var isOpen = $(this).data('open');				
						$(this).children('span:last-child').text(isOpen ? ' (+)' : ' (-)');			
						$(this).data('open', !isOpen);				
						$(this).siblings().slideToggle('fast');
						
						if(!isOpen && $.isFunction(callback)) {
							callback.call(this);
						}
					});
		       	}); 
			    return $(this); 				
			}
		}); 
});