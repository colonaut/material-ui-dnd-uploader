/**
 * Created by kalle on 04.01.2016.
 */
'use strict';
import React from 'react';

import DefaultRawTheme from 'material-ui/lib/styles/raw-themes/light-raw-theme';
import ThemeManager from 'material-ui/lib/styles/theme-manager';

import CircularProgress from 'material-ui/lib/circular-progress';


export default class FileUpload extends React.Component{
    constructor(props) {
        super(props);
    }

    //Important! this is to consume the attributes/fields that are set in a parent context. In this case muiTheme (which should be set in app/main)
    static get contextTypes() {
        return { muiTheme: React.PropTypes.object };
    }

    // ?needed? we have no children - Important! provide uiTheme context for children (static...) http://material-ui.com/#/customization/themes
    static get childContextTypes() {
        return { muiTheme: React.PropTypes.object };
    }
    // ?needed? we have no children - Important! http://material-ui.com/#/customization/themes
    getChildContext() {
        return { muiTheme: this.state.muiTheme };
    }

    //update theme inside state whenever a new theme is passed down from the parent / owner using context
    componentWillReceiveProps(next_props, next_context) {
        this.setState({
            muiTheme: next_context.muiTheme ? next_context.muiTheme : this.state.muiTheme
        });
    }

    componentWillMount(){

        //set theme inside state, either context from parent or imported default theme
        this.setState({
            muiTheme: this.context.muiTheme ? this.context.muiTheme : ThemeManager.getMuiTheme(DefaultRawTheme)
        });

        this._processed_files_count =  0;
        this._reset();
    }



    handleClick(){
        this._reset();
    }

    handleDragEnter(event){
        //console.log('drag enter');
        if (this.state.is_idle) {
            this.setState({
                area_style_key: 'drag_enter'
            });
        }
    }

    handleDragOver(event){
        //console.log('drag over');
        event.preventDefault();
        event.preventDefault();
        if (this.state.is_idle){
            this.setState({
                area_style_key: 'drag_over'
            });
        }
    }

    handleDragExit(){
        //console.log('drag exit');
        this._reset();
    }

    handleDrop(event){
        //console.log('drop', event);
        event.stopPropagation();
        event.preventDefault();
        if (typeof this.props.onDrop === 'function' && this.state.is_idle) { //only do drop stuff if there is something done on drop
            this.setState({
                area_style_key: 'drop',
                message: null,
                is_idle: false,
                is_processing: true
            });
            this._transfer_files = event.dataTransfer.files;
            for (let i = 0, transfer_file; transfer_file = this._transfer_files[i]; i++) {
                let reader = new FileReader();
                reader.onload = ((loaded_file) => {
                    return (evt) => {
                        this.props.onDrop(
                            loaded_file,
                            evt.target.result,
                            this._callbackFileLoaded.bind(this),
                            this._callbackFileProcessed.bind(this));

                    };
                })(transfer_file);
                console.log('determine right method for reader with transfer_file.type:', transfer_file.type);
                reader.readAsText(transfer_file); //� returns the file contents as plain text
                //reader.readAsArrayBuffer(file); // � returns the file contents as an ArrayBuffer (good for binary data such as images)
                //reader.readAsDataURL(file); // � returns the file contents as a data URL
            }
        } else if (this.state.is_idle) {
            this._reset();
        }
    }


    _callbackFileLoaded(message){
        //when a message is passed, we update the messages state
        if (message) {
            let process_messages = this.state.process_messages || [];
            process_messages.unshift(message);
            this.setState({
                process_messages: process_messages,
                area_style_key: 'loaded'
            });
        }
    }

    _callbackFileProcessed(message){
        this._processed_files_count++;

        //when a message is passed, we update the messages state
        if (message) {
            let process_messages = this.state.process_messages || [];
            process_messages.unshift(message);
            this.setState({
                process_messages: process_messages
            });
        }

        //when all fies are done, we apply the done states
        if (this._processed_files_count === this._transfer_files.length){
            this._processed_files_count = 0;
            this.setState({
                is_processing: false,
                message: this.props.processedMessage || 'Done!',
                area_style_key: 'processed'
            });
        }
    }


    _reset() {
        this.setState({
            is_idle: true,
            is_processing: false,
            message: 'Drag your file(s) here!',
            process_messages: [],
            area_style_key: 'idle'
        });
    }


    static get _styles(){
        const float_boxes = {
            boxSizing: 'border-box',
            float: 'left'
        };
        const drag_area = {
            idle: Object.assign({ width: '100%', minWidth: '300px', minHeight: '200px', borderWidth: '5px', borderStyle: 'dashed', borderRadius: '10px' }, float_boxes),
            drag_enter: Object.assign({ width: '100%', minWidth: '300px', minHeight: '200px', borderWidth: '5px', borderStyle: 'dashed', borderRadius: '5px' }, float_boxes),
            drag_over: Object.assign({ width: '100%', minWidth: '300px', minHeight: '200px', borderWidth: '5px', borderStyle: 'dashed', borderRadius: '5px' }, float_boxes),
            drop: Object.assign({ width: '50%', minWidth: '150px', minHeight: '200px' }, float_boxes),
            loaded: Object.assign({ width: '50%', minWidth: '150px', minHeight: '200px' }, float_boxes),
            processed: Object.assign({ width: '50%', minWidth: '150px', minHeight: '200px' }, float_boxes)
        };
        const info_area = {
            idle: Object.assign({display: 'none'}, float_boxes),
            drag_enter: Object.assign({display: 'none'}, float_boxes),
            drag_over: Object.assign({display: 'none'}, float_boxes),
            drop: Object.assign({}, float_boxes),
            loaded: Object.assign({}, float_boxes),
            processed: Object.assign({}, float_boxes)
        };

        return {
            canvas: {},
            drag_area: drag_area,
            info_area: info_area
        };
    }

    static _mergeRelevantContextStyles(mui_theme){
        const styles = FileUpload._styles;
        let raw_theme = mui_theme.rawTheme;

        console.log('the raw theme:', raw_theme);

        Object.assign(styles.canvas, {
            fontFamily: raw_theme.fontFamily
        });
        Object.assign(styles.drag_area.idle, {
           borderColor: raw_theme.palette.accent2Color
        });

        return styles;
    }


    render() {

        let merged_styles = this.constructor._mergeRelevantContextStyles(this.state.muiTheme);

        console.log('the merged style:', merged_styles);

        return(
            <div onClick={this.handleClick.bind(this)}
                 onDragEnter={this.handleDragEnter.bind(this)}
                 onDragOver={this.handleDragOver.bind(this)}
                 onDragExit={this.handleDragExit.bind(this)}
                 onDrop={this.handleDrop.bind(this)}
                 style={merged_styles.canvas}>

                <div style={merged_styles.drag_area[this.state.area_style_key]}>

                    <div style={{display: this.state.message ? 'block' : 'none'
                        }}>
                        <p style={{}}>{this.state.message}</p>
                    </div>

                    <div style={{display: this.state.is_processing ? 'block' : 'none'
                    }}>
                        <CircularProgress mode="indeterminate" />
                    </div>

                </div>

                <div style={merged_styles.info_area[this.state.area_style_key]}>

                    <div style={{display: this.state.process_messages.length ? 'block' : 'none',
                        border: '1px solid #f00',
                        overflow: 'auto',
                        fontFamily: 'Roboto, sans-serif'
                        }}>
                        <pre>{this.state.process_messages.join('\n')}</pre>
                    </div>

                </div>

                <div style={{clear: 'both'}}></div>

            </div>);
    }
}



