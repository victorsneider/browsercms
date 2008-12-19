jQuery(function($){
  
  //Add hover to tr
  $('#sitemap tr.section_node').hover(
    function() { $(this).addClass('hover')},
    function() { $(this).removeClass('hover')}
  )    
  
  //Disable all "buttons"
  $('#buttons a.disabled').click(function(){ return false })

  var dragNode = false;
  var origNode = false;
  
  //drag/drop functionality
  $('#sitemap .icon_node div.movable').draggable({
    revert: 'invalid',
    revertDuration: 200,
    helper: 'clone',
    delay: 200
  })
  $('#sitemap .node .drop_before, #sitemap .node .drop_after').droppable({
    accept: 'div',
    tolerance: 'pointer',
    over: function(e, ui) {
      $(this).addClass('drop-over')
    },
    out: function(e, ui) {
      $(this).removeClass('drop-over')
    },
    drop: function(e, ui) {
      //Remove any drop zone highlights still hanging out
      $('#sitemap .node .drop_before, #sitemap .node .drop_after').removeClass('drop-over')
      
      //Get the object and the id for the src (what we are droping) 
      //and the dest (where we are dropping)
      var src = ui.draggable.parent('td').parent('tr').parents('tr')
      var sid = src[0].id.replace(/section_node_/,'')
      var dest = $(this).parent('tr').parents('tr')
      var did = dest[0].id.replace(/section_node_/,'')
            
      //insert before or after, bsed on the class of the drop zone
      if($(this).hasClass('drop_before') || $(this).hasClass('drop_after')) {
        if($(this).hasClass('drop_before')) {
          var move = 'before'
          src.insertBefore(dest)
        } else {
          var move = 'after'          
          src.insertAfter(dest)
        }
        
        var url = '/cms/section_nodes/move_'+move+'/'+sid
        
        //Update the parent/ancestors as well as the depth
        var old_class = src.attr('class')
        var old_depth = parseInt($('td.node', src).css('padding-left').replace('px','')) || 0
        var new_class = dest.attr('class')
        var new_depth = parseInt($('td.node', dest).css('padding-left').replace('px','')) || 0

        src.attr('class', new_class).addClass('section_node')
        $('td.node', src).css('padding-left', new_depth+'px')

        //Modify the depth of all children
        $('.p'+sid+' td.node, .a'+sid+' td.node').each(function(){
          var cur_depth = parseInt(($(this).css('padding-left').replace('px','')) || 0);
          $(this).css('padding-left', (new_depth - old_depth + cur_depth)+'px')
        })

        //Now remove all the old ancestors and add back the new ones on the children
        $(old_class.replace('p','a').split(' ')).each(function(){ 
          $('.p'+sid+', .a'+sid).removeClass(this) 
        })
        $(new_class.replace('p','a').split(' ')).each(function(){ 
          $('.p'+sid+', .a'+sid).addClass(this) 
        })

        //Now we move over all the decendents of the src
        var prev_node = src;
        $('#sitemap tr.section_node').each(function(){
          if($(this).hasClass('p'+sid) || $(this).hasClass('a'+sid)) {
            $(this).insertAfter(prev_node)
            prev_node = $(this)
          }
        })

        //Now we move over all the decendents of the dest
        prev_node = dest;
        $('#sitemap tr.section_node').each(function(){
          if($(this).hasClass('p'+did) || $(this).hasClass('a'+did)) {
            $(this).insertAfter(prev_node)
            prev_node = $(this)
          }
        })

        //Finally do the ajax request
        $.post(url, { _method: "PUT", section_node_id: did },
          function(data){
            if(data.success) {
              $.cms.showNotice(data.message)
            } else {
              $.cms.showError(data.message)
            }
          }, "json");
      }
      
    }
  });

  //onClick for the folder icon for each section, show/hide section
  $('#sitemap a.folder').click(function(){ 
    var id = this.id.replace(/folder_/,'')
    
    if($(this).hasClass("folder-open")) {
      //Remove this section from the set of open nodes
      $.cookieSet.remove('openSectionNodes', id, {path: '/', expires: 90})

      //close children
      $('.p'+id+', .a'+id).hide()
        .find('a').removeClass("folder-open")
          .find('img').attr('src','/images/cms/icons/actions/folder.png')

      //close this
      $(this).find('img').attr('src','/images/cms/icons/actions/folder.png')
      $(this).removeClass("folder-open")
    } else {
      //Remember to re-open this section
      $.cookieSet.add('openSectionNodes', id, {path: '/', expires: 90})
      
      $('.p'+id).show()
      $(this).find('img').attr('src','/images/cms/icons/actions/folder_open.png')
      $(this).addClass("folder-open")
    }
    return false 
  })
  
  //onClick for the name of a section/page
  $('#sitemap span.node').click(function(){
    $('a.button').addClass('disabled').click(function(){return false})
    $('#sitemap span.node').removeClass('selected')
    $(this).addClass('selected')
        
    var id = this.id.replace(/(section|page|link)_/,'');
    
    if($(this).hasClass('root') || $(this).hasClass('section')) {
      $('#properties-button')
        .removeClass('disabled')
        .attr('href','/cms/sections/edit/'+id)
        .unbind('click')
        .click(function(){return true})
      
      $('#add-page-button')
        .removeClass('disabled')
        .attr('href','/cms/pages/new?section_id='+id)
        .unbind('click')
        .click(function(){return true})

      $('#add-section-button')
        .removeClass('disabled')
        .attr('href','/cms/sections/new?section_id='+id)
        .unbind('click')
        .click(function(){return true})
        
      $('#add-link-button')
        .removeClass('disabled')
        .attr('href','/cms/links/new?section_id='+id)
        .unbind('click')
        .click(function(){return true})
        
    } else if($(this).hasClass('page')) {
      $('#edit-button')
        .removeClass('disabled')
        .attr('href','/cms/pages/show/'+id)
        .unbind('click')
        .click(function(){return true})

      $('#properties-button')
        .removeClass('disabled')
        .attr('href','/cms/pages/edit/'+id)
        .unbind('click')
        .click(function(){return true})

      $('#delete-button')
        .removeClass('disabled')
        .attr('href','/cms/pages/destroy/'+id+'.json')
        .unbind('click')
        .click(function(){
          if(confirm('Are you sure you want to delete this page?')) {
            $.post($(this).attr('href'), { _method: "DELETE" },
              function(data){
                if(data.success) {
                  $.cms.showNotice(data.message)
                } else {
                  $.cms.showError(data.message)
                }
              }, "json");
            $('#page_'+id).parents('.section_node').remove()            
          }
          return false;
        })

      
    } else if($(this).hasClass('link')) {
      $('#properties-button')
        .removeClass('disabled')
        .attr('href','/cms/links/edit/'+id)
        .unbind('click')
        .click(function(){return true})

    }
  })
  
})

//Fire the click even for each section that should be open
jQuery(function($){
  var openSectionNodeIds = $.cookieSet.get('openSectionNodes')
  if(openSectionNodeIds) {
    var openSectionNodeSelector = $.map(openSectionNodeIds, function(e,i){ return "#folder_"+e }).join(', ')
    $(openSectionNodeSelector).click()
  }
})